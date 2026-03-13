import math
from typing import List, Tuple, Dict, Any


class DangerEngine:
    """
    危險計算模組
    功能：
    1. 計算 person 與危險物品的像素距離
    2. 計算 bbox IoU 重疊率
    3. 只有當危險物品發生移動時，才開始累積持續時間
    4. 計算危險指數
    5. 超過門檻時回傳警報資訊
    """

    def __init__(
        self,
        frame_width: int = 640,
        frame_height: int = 480,
        overlap_threshold: float = 0.10,
        move_threshold_px: float = 8.0,
        danger_threshold: float = 25.0,
    ):
        # 危險等級，可自行調整
        self.danger_level = {
            "scissors": 8.0,
            "knife": 8.0,
            "cutter": 7.0,
        }

        self.frame_width = frame_width
        self.frame_height = frame_height

        # IoU 超過這個值，可以視為重疊接觸
        self.overlap_threshold = overlap_threshold

        # 物件中心點移動超過這個像素，視為「開始移動」
        self.move_threshold_px = move_threshold_px

        # 危險指數門檻
        self.danger_threshold = danger_threshold

        # 紀錄每個危險物件前一幀位置
        self.prev_object_centers: Dict[int, Tuple[float, float]] = {}

        # 紀錄每個「人-物」配對累積幀數
        self.interaction_frames: Dict[str, int] = {}

    @staticmethod
    def get_center(box: Tuple[int, int, int, int]) -> Tuple[float, float]:
        x1, y1, x2, y2 = box
        return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)

    @staticmethod
    def calculate_distance(
        person_box: Tuple[int, int, int, int],
        object_box: Tuple[int, int, int, int]
    ) -> float:
        px, py = DangerEngine.get_center(person_box)
        ox, oy = DangerEngine.get_center(object_box)
        return math.sqrt((px - ox) ** 2 + (py - oy) ** 2)

    @staticmethod
    def calculate_iou(
        box_a: Tuple[int, int, int, int],
        box_b: Tuple[int, int, int, int]
    ) -> float:
        ax1, ay1, ax2, ay2 = box_a
        bx1, by1, bx2, by2 = box_b

        inter_x1 = max(ax1, bx1)
        inter_y1 = max(ay1, by1)
        inter_x2 = min(ax2, bx2)
        inter_y2 = min(ay2, by2)

        inter_w = max(0, inter_x2 - inter_x1)
        inter_h = max(0, inter_y2 - inter_y1)
        inter_area = inter_w * inter_h

        area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
        area_b = max(0, bx2 - bx1) * max(0, by2 - by1)

        union_area = area_a + area_b - inter_area
        if union_area <= 0:
            return 0.0

        return inter_area / union_area

    def detect_object_movement(self, obj_id: int, obj_box: Tuple[int, int, int, int]) -> bool:
        current_center = self.get_center(obj_box)

        if obj_id not in self.prev_object_centers:
            self.prev_object_centers[obj_id] = current_center
            return False

        prev_center = self.prev_object_centers[obj_id]
        moved_distance = math.sqrt(
            (current_center[0] - prev_center[0]) ** 2 +
            (current_center[1] - prev_center[1]) ** 2
        )

        self.prev_object_centers[obj_id] = current_center
        return moved_distance >= self.move_threshold_px

    def calculate_danger_score(
        self,
        pixel_distance: float,
        danger_level: float,
        duration_frames: int,
        iou: float
    ) -> Tuple[float, float]:
        """
        危險指數公式

        你原本想法：
        危險指數 = 距離 x 危險等級 x 持續時間

        但距離越大其實應該越不危險，所以實作上改成「距離危險因子」：
        distance_factor = 1 - (distance / frame_diagonal)

        最後公式：
        danger_score = distance_factor * danger_level * duration_frames * (1 + 2*iou)

        好處：
        1. 越近越危險
        2. 重疊越多越危險
        3. 時間越長越危險
        4. 危險等級高的物件分數更高
        """
        frame_diagonal = math.sqrt(self.frame_width ** 2 + self.frame_height ** 2)
        distance_factor = max(0.0, 1.0 - (pixel_distance / (frame_diagonal + 1e-6)))

        overlap_factor = 1.0 + (3.0 * iou) # 增加重疊權重

        # 改良公式：基礎分數由距離與等級決定，時間與重疊作為加成係數
        # 使用 (1 + duration_frames/30) 讓即便第 1 幀也有基礎分數，且隨時間增長
        danger_score = (distance_factor * danger_level) * (1.0 + duration_frames / 15.0) * overlap_factor

        return danger_score, distance_factor

    def evaluate(
        self,
        persons: List[Dict[str, Any]],
        dangerous_objects: List[Dict[str, Any]],
        fps: float
    ) -> List[Dict[str, Any]]:
        """
        persons:
        [
            {"id": 0, "box": (x1,y1,x2,y2), "label": "person"}
        ]

        dangerous_objects:
        [
            {"id": 3, "box": (x1,y1,x2,y2), "label": "knife"}
        ]
        """
        alerts = []

        for person in persons:
            person_id = person["id"]
            person_box = person["box"]

            for obj in dangerous_objects:
                obj_id = obj["id"]
                obj_box = obj["box"]
                obj_label = obj["label"]

                if obj_label not in self.danger_level:
                    continue

                iou = self.calculate_iou(person_box, obj_box)
                distance = self.calculate_distance(person_box, obj_box)
                
                # 計算基礎分數與距離因子
                danger_score, distance_factor = self.calculate_danger_score(
                    pixel_distance=distance,
                    danger_level=self.danger_level[obj_label],
                    duration_frames=0, # 這裡先傳 0 只是為了拿基礎 d_factor
                    iou=iou
                )

                pair_key = f"p{person_id}_o{obj_id}"

                # 只要距離夠近或有重疊，就視為互動，開始累積時間
                # 目前定義：距離因子 > 0.5 (代表距離小於對角線一半) 或 IoU > 0
                is_interacting = (distance_factor > 0.5) or (iou > 0)

                if is_interacting:
                    self.interaction_frames[pair_key] = self.interaction_frames.get(pair_key, 0) + 1
                else:
                    self.interaction_frames[pair_key] = 0

                duration_frames = self.interaction_frames[pair_key]
                duration_seconds = duration_frames / fps if fps > 0 else 0.0

                # 重新計算帶有正確持續時間的分數
                danger_score, distance_factor = self.calculate_danger_score(
                    pixel_distance=distance,
                    danger_level=self.danger_level[obj_label],
                    duration_frames=duration_frames,
                    iou=iou
                )

                moved = self.detect_object_movement(obj_id, obj_box)
                is_overlap_trigger = iou >= self.overlap_threshold
                is_danger_trigger = danger_score >= self.danger_threshold
                triggered = is_overlap_trigger or is_danger_trigger

                # 無論是否觸發警報，只要有基礎分數就回傳，讓前端 UI 能跑進度條
                if danger_score > 0 or is_interacting:
                    alerts.append({
                        "person_id": person_id,
                        "object_id": obj_id,
                        "object_label": obj_label,
                        "distance": distance,
                        "distance_factor": distance_factor,
                        "iou": iou,
                        "moved": moved,
                        "duration_frames": duration_frames,
                        "duration_seconds": duration_seconds,
                        "danger_level": self.danger_level[obj_label],
                        "danger_score": danger_score,
                        "triggered": triggered,
                        "triggered_by": "overlap" if is_overlap_trigger else "danger_score",
                        "person_box": person_box,
                        "object_box": obj_box,
                    })


        return alerts
import os
os.environ["OPENCV_LOG_LEVEL"] = "SILENT"
os.environ["OPENCV_VIDEOIO_MSMF_ENABLE_HW_TRANSFORMS"] = "0"
import cv2
import http.server
import socketserver
import threading
import time
import requests
import json
from ultralytics import YOLO

# 獲取當前腳本目錄以確保路徑正確
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# 模型存放於 video/models/
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'best.pt')

# 導入危險計算引擎
import sys
# danger_engine.py 現在就在 video 目錄下
sys.path.append(BASE_DIR)
try:
    from danger_engine import DangerEngine
except ImportError:
    print("[警告] 無法導入 DangerEngine，請檢查 danger_engine.py 是否在目錄中")
    DangerEngine = None


# ========================
#  設定
# ========================
PORT = 8080
CONF_THRESHOLD = 0.3   # YOLO 信心度門檻
FPS_TARGET = 30         # 降低幀率節省流量 (15 FPS 對手機監控足夠流暢)
STREAM_WIDTH = 480      # 串流寬度
JPEG_QUALITY = 30       # 降低品質大幅節省流量

# ========================
#  初始化
# ========================
print(f">> 載入 YOLO 模型: {MODEL_PATH}...")
try:
    model = YOLO(MODEL_PATH)
    print(">> YOLO 模型載入成功！")
except Exception as e:
    print(f"[警告] 載入 {MODEL_PATH} 失敗，將串流原始畫面: {e}")
    model = None

# 使用字典管理多個頻道
caps = {}
latest_jpegs = {}
latest_risk_data = {"score": 0, "subScores": {"distance": 0, "level": 0, "duration": 0}, "alerts": []}
is_running = True
webhook_url = "https://roy1456.app.n8n.cloud/webhook-test/danger-alert"
last_webhook_time = 0
notification_cooldown = 10 # 10秒冷卻時間，防止連發

if DangerEngine:
    engine = DangerEngine(frame_width=STREAM_WIDTH, frame_height=int(STREAM_WIDTH * 0.75))

def send_webhook_notification(score, sub_scores, alerts, is_test=False):
    global last_webhook_time
    if not webhook_url: 
        print("[警告] Webhook URL 為空，取消發送")
        return False, "Webhook URL 為空"
    
    current_time = time.time()
    if not is_test and (current_time - last_webhook_time < notification_cooldown):
        return False, "冷卻中"
        
    try:
        primary_alert = alerts[0] if alerts else {}
        payload = {
            "event": "risk_detected" if not is_test else "test_event",
            "score": score,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "object": primary_alert.get("object_label", "unknown"),
            "details": {
                "distance": sub_scores["distance"],
                "level": sub_scores["level"],
                "duration": sub_scores["duration"]
            },
            "is_test": is_test
        }
        
        if is_test:
            # 測試模式：同步發送以獲取結果
            try:
                print(f">> [Webhook] 正在發送測試請求至: {webhook_url}...")
                resp = requests.post(webhook_url, json=payload, timeout=5)
                if resp.status_code >= 200 and resp.status_code < 300:
                    print(f">> [Webhook] 測試發送成功！狀態碼: {resp.status_code}")
                    return True, "發送成功"
                else:
                    err_msg = f"n8n 回傳錯誤代碼: {resp.status_code}, 內容: {resp.text[:100]}"
                    print(f"[警告] Webhook 測試失敗: {err_msg}")
                    return False, err_msg
            except Exception as e:
                err_msg = f"網路連線失敗: {str(e)}"
                print(f"[錯誤] Webhook 測試異常: {err_msg}")
                return False, err_msg
        else:
            # 一般模式：非同步發送，不等待結果
            def post():
                try:
                    resp = requests.post(webhook_url, json=payload, timeout=3)
                    print(f">> [Webhook] 自動發送成功 | 狀態: {resp.status_code} | 對象: {payload['object']}")
                except Exception as e:
                    print(f"[警告] Webhook 自動發送失敗: {e}")
            
            threading.Thread(target=post).start()
            last_webhook_time = current_time
            return True, "已異步啟動"
            
    except Exception as e:
        print(f"[錯誤] 準備 Webhook 時出錯: {e}")
        return False, str(e)


def get_dummy_frame(text="NO SIGNAL"):
    import numpy as np
    width, height = STREAM_WIDTH, int(STREAM_WIDTH * 0.75)
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    frame[:] = (39, 24, 17) # 深色背景
    
    # 計算文字位置以置中
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.8
    thickness = 1
    color = (130, 130, 130) # 稍微亮一點的灰色
    
    (text_w, text_h), baseline = cv2.getTextSize(text, font, font_scale, thickness)
    text_x = (width - text_w) // 2
    text_y = (height + text_h) // 2
    
    cv2.putText(frame, text, (text_x, text_y), font, font_scale, color, thickness, cv2.LINE_AA)
    _, buf = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])
    return buf.tobytes()

print(">> 啟動攝影機偵測 (頻道 1)...")
# 預設嘗試開啟第一個相機給頻道 1
for idx in [0, 1, 2]: 
    temp_cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
    if not temp_cap.isOpened() or not temp_cap.read()[0]:
        temp_cap.release()
        temp_cap = cv2.VideoCapture(idx)
    
    if temp_cap.isOpened() and temp_cap.read()[0]:
        caps[1] = temp_cap
        # 設定相機硬體解析度 (選擇較小解析度可減輕讀取負擔)
        temp_cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        temp_cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        print(f">> 攝影機 {idx} 已分配至頻道 1")
        break
    temp_cap.release()

# ========================
#  攝影機擷取執行緒
# ========================
def capture_loop():
    global latest_jpegs
    while is_running:
        start_time = time.time()
        # 遍歷所有已開啟的頻道
        active_channels = list(caps.keys())
        for ch in active_channels:
            cap = caps.get(ch)
            if cap and cap.isOpened():
                ret, frame = cap.read()
                if ret:
                    # 1. 調整大小 (縮圖)
                    h, w = frame.shape[:2]
                    scale = STREAM_WIDTH / w
                    new_size = (STREAM_WIDTH, int(h * scale))
                    small_frame = cv2.resize(frame, new_size, interpolation=cv2.INTER_AREA)

                    # 2. YOLO 辨識
                    if model is not None:
                        # 使用縮小後的圖進行辨識可提升速度
                        results = model(small_frame, conf=CONF_THRESHOLD, verbose=False)
                        annotated = results[0].plot()
                        
                        # 3. 危險計算 (僅針對頻道 1 進行精細計算)
                        if ch == 1 and engine is not None:
                            try:
                                persons = []
                                dangerous_objects = []
                                
                                # 提取 YOLO 預測框
                                for r in results:
                                    boxes = r.boxes
                                    for i, box in enumerate(boxes):
                                        cls_id = int(box.cls[0])
                                        label = r.names[cls_id]
                                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                                        obj_data = {"id": i, "box": (int(x1), int(y1), int(x2), int(y2)), "label": label}
                                        
                                        if label == 'person':
                                            persons.append(obj_data)
                                        elif label in ['scissors', 'knife', 'cutter']:
                                            dangerous_objects.append(obj_data)
                                
                                # 評估風險
                                alerts = engine.evaluate(persons, dangerous_objects, fps=FPS_TARGET)
                                
                                # 更新全局風險數據
                                if alerts:
                                    best_alert = max(alerts, key=lambda a: a["danger_score"])
                                    max_score = best_alert["danger_score"]
                                    # 正規化分數至 0-100 (假設 30 為極度危險)
                                    normalized_score = min(100, int((max_score / 30.0) * 100))
                                    
                                    # 正規化各子項 (0-100)
                                    dist_val = int(best_alert["distance_factor"] * 100)
                                    level_val = min(100, int((best_alert["danger_level"] / 10.0) * 100))
                                    # 持續時間正規化，假設 3 秒 (約 60 幀) 為滿分
                                    dur_val = min(100, int((best_alert["duration_frames"] / 35.0) * 100))

                                    latest_risk_data["score"] = normalized_score
                                    latest_risk_data["subScores"] = {
                                        "distance": dist_val,
                                        "level": level_val,
                                        "duration": dur_val
                                    }
                                    latest_risk_data["alerts"] = alerts
                                    
                                    # 觸發 Webhook 通知 (如果達成警報門檻)
                                    is_triggered = any(a.get("triggered", False) for a in alerts)
                                    if is_triggered:
                                        send_webhook_notification(normalized_score, latest_risk_data["subScores"], alerts)
                                else:
                                    # 無警報時，分數緩慢下降
                                    latest_risk_data["score"] = max(0, latest_risk_data["score"] - 5)
                                    latest_risk_data["subScores"] = {
                                        "distance": max(0, latest_risk_data["subScores"]["distance"] - 5),
                                        "level": max(0, latest_risk_data["subScores"]["level"] - 10),
                                        "duration": 0
                                    }

                            except Exception as e:
                                print(f"[錯誤] 危險引擎計算失敗: {e}")
                    else:
                        annotated = small_frame

                    # 4. 編碼與壓縮
                    _, buf = cv2.imencode('.jpg', annotated, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])
                    latest_jpegs[ch] = buf.tobytes()

                else:
                    # 讀取失敗，暫時移除以避免卡頓，等待手動或自動重連
                    print(f">> 頻道 {ch} 讀取失敗，移除連線")
                    cap.release()
                    del caps[ch]
                    if ch in latest_jpegs: del latest_jpegs[ch]
        
        # 動態計算休眠時間以維持穏定 FPS
        elapsed = time.time() - start_time
        sleep_time = max(0, (1.0 / FPS_TARGET) - elapsed)
        time.sleep(sleep_time)

# ========================
#  HTTP 串流 Handler
# ========================
class StreamHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')

    def do_GET(self):
        from urllib.parse import urlparse, parse_qs
        parsed_path = urlparse(self.path)
        params = parse_qs(parsed_path.query)
        
        if parsed_path.path == '/video_feed':
            ch = int(params.get('ch', [1])[0]) # 預設頻道 1
            
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Cache-Control', 'no-cache, private')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME')
            self.end_headers()
            
            try:
                while is_running:
                    frame_data = latest_jpegs.get(ch)
                    if not frame_data:
                        # 若無訊號，動態生成虛擬畫面
                        frame_data = get_dummy_frame(f"CH-{ch:02d} NO SIGNAL")
                    
                    self.wfile.write(b'--FRAME\r\n')
                    self.send_header('Content-Type', 'image/jpeg')
                    self.send_header('Content-Length', len(frame_data))
                    self.end_headers()
                    self.wfile.write(frame_data)
                    self.wfile.write(b'\r\n')
                    time.sleep(1.0 / FPS_TARGET)
            except Exception:
                pass
                
        elif parsed_path.path == '/camera_status':
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            import json
            # 回傳所有頻道的連線狀態
            status = {ch: True for ch in caps}
            self.wfile.write(json.dumps(status).encode())
            
        elif parsed_path.path == '/reconnect_camera':
            ch = int(params.get('ch', [1])[0])
            source_param = params.get('source', [None])[0]
            
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            if ch in caps:
                caps[ch].release()
                del caps[ch]
                
            print(f">> 收到頻道 {ch} 重新連線請求，來源: {source_param if source_param else '自動掃描'}")
            
            success = False
            if source_param:
                try:
                    if source_param.isdigit():
                        src = int(source_param)
                        temp_cap = cv2.VideoCapture(src, cv2.CAP_DSHOW)
                    else:
                        src = source_param
                        temp_cap = cv2.VideoCapture(src)
                        
                    if temp_cap.isOpened() and temp_cap.read()[0]:
                        caps[ch] = temp_cap
                        print(f">> 頻道 {ch} 手動連線成功: {src}")
                        success = True
                    else:
                        temp_cap.release()
                except Exception as e:
                    print(f">> 手動連線出錯: {e}")
            
            if not success:
                # 自動掃描未被佔用的相機
                used_indices = []
                for c in caps.values():
                    # 嘗試取得索引，若是檔案/URL 則無法取得 int 索引
                    idx_attr = c.get(cv2.CAP_PROP_POS_FRAMES) # 這裡稍微隨便測一下
                    # 實際上我們比較難精確知道哪個 index 被用了，簡單掃描 0,1,2 中沒在 caps 裡的
                    pass 
                
                for idx in [0, 1, 2]:
                    # 避免重複開啟已在其他頻道的相機 (這部分逻辑簡化)
                    temp_cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
                    if temp_cap.isOpened() and temp_cap.read()[0]:
                        # 檢查是否已被其他頻道使用 (比對物件較難，此處簡單假設 index)
                        caps[ch] = temp_cap
                        print(f">> 頻道 {ch} 自動連線成功：攝影機 {idx}")
                        success = True
                        break
                    temp_cap.release()
                
            import json
            self.wfile.write(json.dumps({"connected": success, "ch": ch}).encode())
            
        elif parsed_path.path == '/risk_data':
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            import json
            self.wfile.write(json.dumps(latest_risk_data).encode())
            
        elif parsed_path.path == '/set_webhook':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                global webhook_url
                webhook_url = data.get('url', "")
                print(f">> [Webhook] URL 已設定為: {webhook_url}")
                
                self.send_response(200)
                self.send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "url": webhook_url}).encode())
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(str(e).encode())
                
        elif parsed_path.path == '/process_frame':
            # 接收手機傳來的影格並回傳辨識後的結果 (Base64)
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                import base64
                import numpy as np
                # 資料格式預期為 JSON { "image": "data:image/jpeg;base64,..." }
                data = json.loads(post_data)
                img_data = data.get('image', "")
                if "," in img_data:
                    img_data = img_data.split(",")[1]
                
                # 解碼
                img_bytes = base64.b64decode(img_data)
                nparr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if frame is not None:
                    # 處理 (Resize + YOLO + DangerEngine)
                    h, w = frame.shape[:2]
                    scale = STREAM_WIDTH / w
                    new_size = (STREAM_WIDTH, int(h * scale))
                    small_frame = cv2.resize(frame, new_size, interpolation=cv2.INTER_AREA)
                    
                    if model is not None:
                        results = model(small_frame, conf=CONF_THRESHOLD, verbose=False)
                        annotated = results[0].plot()
                        
                        # 同步更新風險數據 (頻道 1 模式)
                        if engine is not None:
                            persons = []
                            dangerous_objects = []
                            for r in results:
                                for i, box in enumerate(r.boxes):
                                    label = r.names[int(box.cls[0])]
                                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                                    obj_data = {"id": i, "box": (int(x1), int(y1), int(x2), int(y2)), "label": label}
                                    if label == 'person': persons.append(obj_data)
                                    elif label in ['scissors', 'knife', 'cutter']: dangerous_objects.append(obj_data)
                            
                            alerts = engine.evaluate(persons, dangerous_objects, fps=FPS_TARGET)
                            if alerts:
                                best_alert = max(alerts, key=lambda a: a["danger_score"])
                                latest_risk_data["score"] = min(100, int((best_alert["danger_score"] / 30.0) * 100))
                                latest_risk_data["subScores"] = {
                                    "distance": int(best_alert["distance_factor"] * 100),
                                    "level": min(100, int((best_alert["danger_level"] / 10.0) * 100)),
                                    "duration": min(100, int((best_alert["duration_frames"] / 35.0) * 100))
                                }
                                latest_risk_data["alerts"] = alerts
                                if any(a.get("triggered", False) for a in alerts):
                                    send_webhook_notification(latest_risk_data["score"], latest_risk_data["subScores"], alerts)
                            else:
                                latest_risk_data["score"] = max(0, latest_risk_data["score"] - 2)
                    else:
                        annotated = small_frame
                    
                    # 編碼並更新全域串流 (讓其他連線者也能看到手機鏡頭畫面)
                    _, buf = cv2.imencode('.jpg', annotated, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])
                    img_bytes = buf.tobytes()
                    latest_jpegs[1] = img_bytes # 更新頻道 1
                    
                    encoded_img = base64.b64encode(buf).decode('utf-8')
                    
                    self.send_response(200)
                    self.send_cors_headers()
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "image": f"data:image/jpeg;base64,{encoded_img}",
                        "risk": latest_risk_data
                    }).encode())
                else:
                    raise Exception("Frame decode failed")
            except Exception as e:
                import traceback
                traceback.print_exc()
                self.send_response(400)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())

        elif parsed_path.path == '/test_webhook':

            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            if webhook_url:
                success, msg = send_webhook_notification(99, {"distance": 50, "level": 80, "duration": 10}, [{"object_label": "TEST_OBJECT", "triggered": True}], is_test=True)
            else:
                success, msg = False, "未設定 Webhook URL"
                
            self.wfile.write(json.dumps({"success": success, "message": msg, "url": webhook_url}).encode())
            
        elif parsed_path.path == '/':

            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'''
                <html><body style="background:#000;margin:0">
                <img src="/video_feed?ch=1" style="width:100%;height:auto">
                </body></html>
            ''')

# ========================
#  啟動
# ========================
capture_thread = threading.Thread(target=capture_loop, daemon=True)
capture_thread.start()

print(f">> 串流伺服器啟動於 http://127.0.0.1:{PORT}")
print(f">> 按 Ctrl+C 停止")

class StreamingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

try:
    server = StreamingServer(('', PORT), StreamHandler)
    server.serve_forever()
except KeyboardInterrupt:
    print("\n>> 伺服器已停止。")
    is_running = False
    for cap in caps.values():
        cap.release()

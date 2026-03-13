import os.path  # 導入 os.path 模組，用於處理檔案路徑
import tkinter as tk  # 導入 tkinter 模組並別名為 tk，用於建立 GUI
from tkinter import messagebox  # 從 tkinter 導入 messagebox，用於顯示訊息對話框
import cv2  # 導入 OpenCV 模組，用於影像處理
import time  # 導入 time 模組，用於時間操作
import threading  # 導入 threading 模組，用於多執行緒處理
import base64  # 導入 base64 模組，用於編碼解碼
from email.message import EmailMessage  # 從 email.message 導入 EmailMessage，用於建立郵件
from PIL import Image, ImageTk  # 從 PIL 導入 Image 和 ImageTk，用於影像處理和 Tkinter 顯示
import http.server
import socketserver

# --- YOLO 相關套件 ---  # 註解：以下導入 YOLO 相關的套件
from ultralytics import YOLO  # 導入 YOLO 模型，用於目標偵測

# --- Google API 相關套件 ---  # 註解：以下導入 Google API 相關的套件
from google.auth.transport.requests import Request  # 導入 Request，用於 Google 認證請求
from google.oauth2.credentials import Credentials  # 導入 Credentials，用於儲存 Google 認證憑證
from google_auth_oauthlib.flow import InstalledAppFlow  # 導入 InstalledAppFlow，用於 OAuth 2.0 認證流程
from googleapiclient.discovery import build  # 導入 build，用於建立 Google API 服務

SCOPES = ['https://www.googleapis.com/auth/gmail.send']  # 定義 Gmail API 的權限範圍，只允許發送郵件

class IntegratedApp:  # 定義主應用程式類別
    def __init__(self, window):  # 建構函式，初始化應用程式
        self.window = window  # 儲存 GUI 視窗物件
        self.window.title("居家照護系統專案")  # 設定視窗標題
        self.window.geometry("960x680")  # 設定視窗大小為 960x680

        self.is_running = True  # 初始化執行狀態標誌為 True
        self.is_sending_email = False  # 初始化郵件發送狀態標誌為 False
        self.email_cooldown_seconds = 10  # 郵件冷卻時間為 10 秒
        self.latest_jpeg = None  # 最新的 JPEG 影像
        self.model = None  # YOLO 模型，稍後載入

        # ====================
        #   啟動串流伺服器（最優先）
        # ====================
        server_thread = threading.Thread(target=self.start_streaming_server)
        server_thread.daemon = True
        server_thread.start()

        # ====================
        #   載入 YOLO 模型
        # ====================
        try:
            self.model = YOLO('best.pt')
        except Exception as e:
            print(f"[警告] 載入 best.pt 失敗，將串流原始畫面: {e}")

        # ====================  # 分隔符號
        #   上半部：影像與控制區  # 註解：以下程式碼用於上半部的影像和控制元件
        # ====================  # 分隔符號
        self.video_label = tk.Label(window)  # 建立標籤用於顯示影像
        self.video_label.pack(pady=10)  # 將影像標籤放入視窗，設定上下邊距

        control_frame = tk.Frame(window)  # 建立控制框架
        control_frame.pack(pady=5)  # 將控制框架放入視窗，設定上下邊距

        tk.Label(control_frame, text="信心度閾值 (Confidence):", font=("DFKai-SB", 16)).grid(row=0, column=0, padx=5)  # 建立標籤，顯示信心度閾值說明
        self.conf_slider = tk.Scale(control_frame, from_=1, to=100, orient=tk.HORIZONTAL, length=200)  # 建立滑桿用於調整信心度，範圍 1-100
        self.conf_slider.set(25)  # 設定滑桿預設值為 25
        self.conf_slider.grid(row=0, column=1, padx=5)  # 將滑桿放入網格佈局

        self.auto_alert_var = tk.BooleanVar(value=False)  # 建立布林變數用於儲存自動警報狀態，初始值為 False
        self.auto_alert_cb = tk.Checkbutton(  # 建立複選框
            control_frame,  # 將其放入控制框架
            text="啟用自動警報 (畫面出現方框即寄信)",  # 複選框標籤文字
            variable=self.auto_alert_var,  # 綁定到自動警報狀態變數
            font=("DFKai-SB", 16, "bold"),  # 設定字體為 DFKai-SB, 16 號，粗體
            fg="red"  # 設定文字顏色為紅色
        )
        self.auto_alert_cb.grid(row=0, column=2, padx=20)  # 將複選框放入網格佈局

        # ====================  # 分隔符號
        #   中間：信箱輸入區  # 註解：以下程式碼用於信箱輸入區
        # ====================  # 分隔符號
        email_frame = tk.Frame(window)  # 建立郵箱框架
        email_frame.pack(pady=5)  # 將郵箱框架放入視窗，設定上下邊距
        
        tk.Label(email_frame, text="警報收件者信箱:", font=("DFKai-SB", 16)).pack(side=tk.LEFT, padx=5)  # 建立標籤，顯示郵箱說明
        self.email_entry = tk.Entry(email_frame, width=30, font=("DFKai-SB", 16))  # 建立文字輸入框，設定寬度和字體
        self.email_entry.insert(0, "YOUR_EMAIL@gmail.com")  # 在輸入框中插入預設文字
        self.email_entry.pack(side=tk.LEFT)  # 將輸入框放入框架，靠左對齐

        # ====================  # 分隔符號
        #   下半部：日誌與控制區  # 註解：以下程式碼用於下半部的日誌和控制區
        # ====================  # 分隔符號
        tk.Frame(window, height=2, bd=1, relief=tk.SUNKEN).pack(fill=tk.X, padx=50, pady=10)  # 建立分隔線框架並放入視窗
        self.text_area = tk.Text(window, height=10, width=75, font=("DFKai-SB", 10))  # 建立文字區域用於顯示日誌
        self.text_area.pack(pady=10)  # 將文字區域放入視窗

        # ====================  # 分隔符號
        #   啟動 WebCam 與 Gmail 授權  # 註解：以下程式碼用於啟動攝影機和 Gmail 授權
        # ====================  # 分隔符號
        self.cap = cv2.VideoCapture(0) # 0 代表預設的第一顆鏡頭  # 開啟預設的攝影機，0 代表第一顆鏡頭
        if not self.cap.isOpened():  # 檢查攝影機是否成功開啟
            messagebox.showerror("攝影機錯誤", "無法開啟攝影機，請確認鏡頭是否已連接或被其他程式佔用。")  # 顯示錯誤對話框
            self.window.destroy()  # 關閉視窗
            return  # 結束函式執行

        self.authenticate_gmail()  # 呼叫 Gmail 認證函式
        
        self.latest_jpeg = None
        server_thread = threading.Thread(target=self.start_streaming_server)
        server_thread.daemon = True
        server_thread.start()

        # 啟動即時更新迴圈  # 註解：啟動影像更新迴圈
        self.update_frame()  # 呼叫影像更新函式 

    def log_to_text_area(self, message):  # 定義函式，用於在文字區域添加日誌訊息
        self.text_area.insert(tk.END, message + "\n")  # 在文字區域末端插入訊息
        self.text_area.see(tk.END)  # 自動捲動到文字區域末端

    def authenticate_gmail(self):  # 定義函式，用於 Gmail 認證
        """處理 Google Gmail API 授權"""  # 函式文件字串，說明函式用途
        creds = None  # 初始化認証憑証為 None
        if os.path.exists('token.json'):  # 檢查是否存在儲存的令牌檔案
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)  # 從令牌檔案讀取認証憑証
        if not creds or not creds.valid:  # 如果沒有認証憑証或認証已過期
            if creds and creds.expired and creds.refresh_token:  # 如果認証憑証已過期且存在重新整理令牌
                try: creds.refresh(Request())  # 嘗試重新整理認証憑証
                except Exception as e: self.log_to_text_area(f"刷新憑証失敗: {e}")  # 如果重新整理失敗，記錄錯誤訊息
            else:  # 如果沒有認証憑証或無法重新整理
                if not os.path.exists('credentials.json'):  # 檢查是否存在認証檔案
                    self.log_to_text_area("錯誤：缺少 credentials.json，無法寄信。")  # 如果不存在，記錄錯誤訊息
                    return None  # 回傳 None
                flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)  # 建立 OAuth 認証流程
                creds = flow.run_local_server(port=0)  # 執行本地伺服器進行認証，使用隨機連接埠
            with open('token.json', 'w') as token:  # 開啟令牌檔案用於寫入
                token.write(creds.to_json())  # 將認証憑証寫入令牌檔案
        return creds  # 回傳認証憑証

    def trigger_email_alert(self, target_email, image_frame):  # 定義函式，用於觸發郵件警報
        self.is_sending_email = True  # 設定郵件發送狀態為 True
        self.log_to_text_area(f">> 偵測到目標！準備發送警報郵件至: {target_email}...")  # 記錄準備發送郵件的訊息
        
        image_copy = image_frame.copy()  # 複製影像框架
        email_thread = threading.Thread(  # 建立新的執行緒
            target=self._send_email_task,  # 執行郵件發送任務
            args=(target_email, image_copy)  # 傳入目標郵箱和影像
        )
        email_thread.daemon = True  # 設定執行緒為守護執行緒
        email_thread.start()  # 啟動執行緒

    def _send_email_task(self, target_email, image_frame):  # 定義函式，用於在執行緒中發送郵件
        try:  # 開始 try 區塊
            creds = self.authenticate_gmail()  # 呼叫 Gmail 認証函式
            if not creds: return  # 如果認証失敗，結束函式

            service = build('gmail', 'v1', credentials=creds)  # 建立 Gmail API 服務

            message = EmailMessage()  # 建立郵件物件
            message.set_content("這是一封由 YOLOv8 即時監控系統發送的警報信件。\n\n鏡頭剛剛偵測到了目標物件。\n請查看附件的現場畫面截圖。")  # 設定郵件內容
            message['To'] = target_email  # 設定收件人
            message['From'] = 'me'  # 設定寄件人為 'me' (表示使用認証的帳戶)
            message['Subject'] = '【監控系統警報】偵測到目標物件'  # 設定郵件主旨

            # 將 OpenCV 影像轉為 JPG 格式加入附件  # 註解：以下程式碼用於將影像轉換為 JPG 格式並作為附件
            success, encoded_image = cv2.imencode('.jpg', image_frame)  # 將影像編碼為 JPG 格式
            if success:  # 如果編碼成功
                message.add_attachment(  # 添加附件
                    encoded_image.tobytes(),  # 將編碼影像轉換為位元組
                    maintype='image', subtype='jpeg', filename='live_alert.jpg'  # 設定附件類型和檔案名稱
                )

            encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()  # 對郵件進行 Base64 編碼
            create_message = {'raw': encoded_message}  # 建立郵件字典

            service.users().messages().send(userId="me", body=create_message).execute()  # 透過 Gmail API 發送郵件
            self.window.after(0, self.log_to_text_area, f"✅ 郵件發送成功！將冷卻 {self.email_cooldown_seconds} 秒。")  # 記錄發送成功訊息
            
        except Exception as error:  # 捕捉例外
            self.window.after(0, self.log_to_text_area, f"❌ 郵件發送失敗: {error}")  # 記錄發送失敗訊息
            
        finally:  # 最後執行區塊，無論是否出現例外都會執行
            time.sleep(self.email_cooldown_seconds)  # 等待冷卻時間經過
            self.is_sending_email = False  # 設定郵件發送狀態為 False
            self.window.after(0, self.log_to_text_area, ">> 冷卻完畢，繼續監控畫面。")  # 記錄冷卻完畢訊息

    def update_frame(self):  # 定義函式，用於更新每一幀影像
        """讀取攝影機畫面並進行 YOLO 推論"""  # 函式文件字串
        if self.is_running:  # 檢查應用程式是否正在執行
            ret, frame = self.cap.read()  # 從攝影機讀取一幀影像
            if ret:  # 如果成功讀取影像
                # 1. 取得滑桿設定的信心度
                conf_val = self.conf_slider.get() / 100.0
                
                # 2. 進行 YOLO 推論（若模型可用）
                if self.model is not None:
                    results = self.model(frame, conf=conf_val, verbose=False)
                    annotated_frame = results[0].plot()
                    # 3. 判斷是否有偵測到物件並處理寄信邏輯
                    if len(results[0].boxes) > 0:
                        if self.auto_alert_var.get() and not self.is_sending_email:
                            target_email = self.email_entry.get().strip()
                            if target_email:
                                self.trigger_email_alert(target_email, annotated_frame)
                            else:
                                self.log_to_text_area("警告：未填寫收件者信箱，無法發送警報！")
                                self.auto_alert_var.set(False)
                else:
                    annotated_frame = frame  # 沒有模型時，直接串流原始畫面

                # ==========================================  # 分隔符號
                # 🌟 新增：將顯示畫面縮小  # 註解：以下程式碼用於縮小顯示的影像尺寸
                # ==========================================  # 分隔符號
                # 設定您想要的畫面寬度 (例如 480 或 640)  # 註解：定義顯示畫面的寬度
                display_width = 640  # 設定顯示寬度為 640 像素
                h, w = annotated_frame.shape[:2]  # 獲取影像的高度和寬度
                
                # 如果原本的畫面比設定的寬度還要大，就進行等比例縮小  # 註解：對於較大的影像進行縮放
                if w > display_width:  # 檢查影像寬度是否超過設定寬度
                    ratio = display_width / w  # 計算縮放比例
                    display_height = int(h * ratio)  # 根據比例計算新的高度
                    # 縮放畫面  # 註解：調整影像大小
                    annotated_frame = cv2.resize(annotated_frame, (display_width, display_height))  # 使用 OpenCV 縮放影像
                # ==========================================  # 分隔符號

                # 4. 更新 Tkinter 畫面 (使用縮小後的 annotated_frame)  # 註解：在 GUI 上顯示處理後的影像
                success, buffer = cv2.imencode('.jpg', annotated_frame)
                if success:
                    self.latest_jpeg = buffer.tobytes()

                cv_image = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)  # 將影像顏色空間從 BGR 轉換為 RGB (Tkinter 使用 RGB)
                pil_image = Image.fromarray(cv_image)  # 將 numpy 陣列轉換為 PIL 影像
                tk_image = ImageTk.PhotoImage(image=pil_image)  # 將 PIL 影像轉換為 Tkinter PhotoImage
                self.video_label.imgtk = tk_image  # 儲存 PhotoImage 參考以防止垃圾回收
                self.video_label.configure(image=tk_image)  # 更新標籤上的影像

        # 縮短延遲至 30 毫秒，讓串流更流暢 (約 30 FPS)  # 註解：設定每幀之間的延遲以實現流暢的影像更新
        self.window.after(30, self.update_frame)  # 在 30 毫秒後再次調用 update_frame 函式

    def on_closing(self):  # 定義函式，用於處理視窗關閉事件
        """關閉程式時釋放攝影機資源"""  # 函式文件字串
        self.is_running = False  # 設定執行狀態為 False，停止影像更新
        if hasattr(self, 'cap') and self.cap.isOpened():  # 檢查是否存在攝影機物件且已開啟
            self.cap.release()  # 釋放攝影機資源
        self.window.destroy()  # 銷毀視窗，結束程式

    def start_streaming_server(self):
        class StreamingHandler(http.server.BaseHTTPRequestHandler):
            def do_GET(handler_self):
                if handler_self.path == '/video_feed':
                    handler_self.send_response(200)
                    handler_self.send_header('Access-Control-Allow-Origin', '*')
                    handler_self.send_header('Age', 0)
                    handler_self.send_header('Cache-Control', 'no-cache, private')
                    handler_self.send_header('Pragma', 'no-cache')
                    handler_self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME')
                    handler_self.end_headers()
                    try:
                        while self.is_running:
                            if self.latest_jpeg is not None:
                                handler_self.wfile.write(b'--FRAME\r\n')
                                handler_self.send_header('Content-Type', 'image/jpeg')
                                handler_self.send_header('Content-Length', len(self.latest_jpeg))
                                handler_self.end_headers()
                                handler_self.wfile.write(self.latest_jpeg)
                                handler_self.wfile.write(b'\r\n')
                            time.sleep(0.06)
                    except Exception:
                        pass
                else:
                    handler_self.send_error(404)
                    handler_self.end_headers()

            def log_message(self, format, *args):
                pass
        
        class StreamingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
            allow_reuse_address = True
            daemon_threads = True
            
        address = ('', 8080)
        server = StreamingServer(address, StreamingHandler)
        print(">> 影像串流伺服器已啟動於 port 8080 (/video_feed)")
        server.serve_forever()

if __name__ == "__main__":  # 檢查該檔案是否作為主程式執行
    root = tk.Tk()  # 建立 Tkinter 根視窗
    app = IntegratedApp(root)  # 建立應用程式實例
    root.protocol("WM_DELETE_WINDOW", app.on_closing)  # 設定視窗關閉時的處理函式
    root.mainloop()  # 啟動 GUI 事件迴圈，顯示視窗並等待使用者交互
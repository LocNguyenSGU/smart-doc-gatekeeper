## 1. Mở rộng Ý tưởng: "The Smart Doc Gatekeeper"

Thay vì chỉ là một công cụ chuyển tiếp link, Extension của bạn sẽ đóng vai trò **Bộ lọc thông minh** với 3 lớp xử lý:

1. **Discovery Layer:** Tự động tìm Sitemap hoặc dùng Headless Browser (Playwright) để quét cấu trúc Menu/Sidebar của website.
2. **AI-Prioritization Layer:** Sử dụng một model LLM rẻ/nhanh (như GPT-4o-mini hoặc Haiku) để đọc qua các Title/Description của các URL thu thập được. Nó sẽ gán điểm "độ liên quan" dựa trên Issue A của bạn.
3. **Optimization Layer:** Chỉ đẩy những URL có điểm cao nhất vào NotebookLM, kèm theo một bản "Context Map" (Tóm tắt cấu trúc tài liệu) để NotebookLM hiểu sơ đồ tư duy của bộ Docs đó.

---

## 2. User Requirement Document (URD)

### 2.1. Mục tiêu hệ thống

Giúp người dùng (chủ Business IT) nhanh chóng trích xuất giải pháp từ các bộ Docs đồ sộ mà không cần đọc thủ công, thông qua việc tự động hóa thu thập, lọc và đẩy dữ liệu vào NotebookLM.

### 2.2. Các chức năng chính (Functional Requirements)

#### **F1. Thu thập dữ liệu (Smart Crawling)**

* **Input:** Người dùng dán 1 URL gốc (e.g., `docs.openclaw.ai`).
* **Process:** * Hệ thống tự động tìm `/sitemap.xml`.
  * Nếu không có, hệ thống dùng Playwright quét các thẻ `<nav>` hoặc `sidebar` để lấy cây thư mục link.
  * Phân loại link: Đâu là link hướng dẫn (Tutorial), đâu là link tham chiếu API (Reference), đâu là link giới thiệu (Concepts).

#### **F2. Lọc thông tin theo mục tiêu (AI Filtering)**

* **Input:** Issue A (Câu hỏi/Vấn đề cụ thể của Lộc).
* **Process:** * AI duyệt qua danh sách URL đã tìm được.
  * Loại bỏ các trang rác (Privacy Policy, Contact, v.v.).
  * Giữ lại tối đa ~15 link liên quan nhất đến Issue A để tránh loãng NotebookLM.

#### **F3. Quản lý bộ câu hỏi mẫu (Template Management)**

* Cho phép người dùng lưu các "Prompt mẫu" (ví dụ: "Phân tích khả năng tích hợp", "Viết mã nguồn minh họa cho NestJS", "So sánh ưu nhược điểm").
* Tự động kết hợp Prompt mẫu với thông tin Issue A để tạo ra yêu cầu hoàn chỉnh cho AI.

#### **F4. Tích hợp NotebookLM / RAG Export**

* Xuất danh sách URL đã lọc sang định dạng mà NotebookLM chấp nhận tốt nhất (Markdown hoặc danh sách URL sạch).
* Cung cấp giao diện "One-click" để đẩy dữ liệu.

### 2.3. Yêu cầu phi chức năng (Non-functional Requirements)

* **Tốc độ:** Quá trình quét và lọc 100 links phải diễn ra trong < 30 giây.
* **Sự thuận tiện:** Giao diện Extension phải nằm ngay trên trình duyệt để người dùng không phải chuyển tab qua lại.
* **Tính riêng tư:** Cho phép chạy Local LLM (qua Ollama) để lọc link nếu tài liệu là nội bộ/nhạy cảm.

---

## tôi muốn nâng cấp hơn là có 1 chế độ gọi là planing, lúc này khi tôi đưa ra 1 vân đề nó phải tự suy luận, đặt ra các câu hỏi để hỏi lại tôi, cho tôi các phương ấn lựa chọn có thể là ngoài link tôi đưa luôn để mà câu trả lời cuối cùng đưa ra là tốt nhất



### . Mở rộng Ý tưởng: Chế độ "Advanced Planning Mode"

Trong chế độ này, Extension không quét link ngay. Nó sẽ đóng vai trò là một  **Solution Architect** .

* **Lớp Phân tích (Reasoning Layer):** Khi nhận Issue A, AI sẽ phân tích xem thông tin bạn đưa đã đủ để giải quyết vấn đề trong thực tế Business chưa.
  * *Ví dụ:* Bạn muốn build Multi-agent cho Dropshipping, AI sẽ nhận ra là tài liệu OpenClaw chỉ nói về "cách build agent", nhưng chưa nói về "cách kết nối API kho vận" hay "quản lý trạng thái đơn hàng".
* **Lớp Tương tác (Interaction Layer):** AI đặt ra các câu hỏi ngược (Counter-questions) để làm rõ bối cảnh.
  * *Ví dụ:* "Bạn dùng nền tảng Dropshipping nào (Shopee hay Shopify)?", "Bạn muốn Agent tự quyết định hay cần con người duyệt?".
* **Lớp Mở rộng (Expansion Layer):** AI tự động gợi ý thêm các nguồn tài liệu ngoài (ví dụ: tài liệu API của đơn vị vận chuyển, hoặc các Best-practices về Microservices) để bổ trợ cho link gốc bạn cung cấp.



#### F5. Chế độ Planning (Strategic Thinking)

* **Input:** Issue A và các URL khởi đầu.
* **Process:**
  1. **Issue Deconstruction:** AI chia nhỏ Issue A thành các bài toán con (Sub-problems).
  2. **Gap Analysis:** AI so sánh giữa mục tiêu của bạn và nội dung trong tài liệu để tìm ra các "khoảng trống" kiến thức.
  3. **Clarification Loop:** Hiển thị danh sách 3-5 câu hỏi trắc nghiệm hoặc câu hỏi ngắn để bạn xác nhận hướng đi.
  4. **External Suggestion:** Tự động tìm kiếm nhanh (Search Web) để đề xuất các thư viện hoặc link liên quan khác (ví dụ: NestJS Microservices docs) nếu tài liệu hiện tại không đủ.
* **Output:** Một "Master Plan" bao gồm: Danh sách link đã lọc + Các link bổ sung + Prompt chuyên sâu để ném vào NotebookLM.



### 4. Quy trình người dùng nâng cấp (Workflow)

1. **Nhập Issue A & Link:** Dán link OpenClaw.
2. **Kích hoạt Planning Mode:** * Extension không đi crawl ngay. AI hiện ra: *"Để build Multi-agent Logistics hiệu quả, tôi cần biết: 1. Bạn ưu tiên tốc độ hay độ chính xác? 2. Bạn đã có hệ thống theo dõi vận đơn chưa?"*
3. **Bạn phản hồi:** Bạn chọn các phương án AI đưa ra.
4. **AI đề xuất lộ trình:** * *"Tôi sẽ lấy 10 link từ OpenClaw + 2 link về NestJS BullMQ (để xử lý hàng đợi đơn hàng) vì bạn yêu cầu độ chính xác cao."*
5. **Review & Push:** Bạn nhấn "Confirm", lúc này Extension mới thực hiện việc tổng hợp và đẩy toàn bộ dữ liệu "sạch" nhất vào NotebookLM.


* **Tập trung vào kết quả:** Bạn không tốn thời gian cho những tính năng Agent không cần thiết.
* **Tránh lặp lại:** Những gì bạn đã trả lời ở bước Planning sẽ được AI ghi nhớ và đưa vào Prompt cuối cùng, NotebookLM sẽ không hỏi lại những điều đó nữa.
* **Chuyên nghiệp hóa:** Với tư cách chủ Business, bạn chỉ cần đưa ra "đề bài" và "quyết định", AI lo phần "khảo sát" và "lọc tài liệu".

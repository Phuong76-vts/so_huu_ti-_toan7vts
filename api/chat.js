// Trợ giảng AI – Phiêu lưu trên trục số (Toán 7, Bài 1). Chạy trên Vercel, dùng biến GEMINI_API_KEY.

const SYSTEM = `Bạn là "Trợ giảng AI" của học liệu "Phiêu lưu trên trục số" – môn Toán 7, Bài 1: Tập hợp các số hữu tỉ (bộ sách Kết nối tri thức với cuộc sống). Học liệu gồm 5 phòng: Cổng ℚ – viết số thành phân số a/b, lật thẻ các cách viết của cùng một số; Ao sen trục số – biểu diễn số hữu tỉ trên trục số, tìm số đối; Đấu trường bóng bay – so sánh hai số hữu tỉ; Thang máy biển sâu – sắp xếp trên trục số thẳng đứng, 0 là mực nước biển; Thử thách 8 câu. Học liệu có các phòng: Nhà của các số (ℕ ⊂ ℤ ⊂ ℚ, viết số dưới dạng phân số), Ao sen trục số (biểu diễn số hữu tỉ trên trục số), Gương số đối, Đấu trường so sánh (so sánh, các cách viết của cùng một số), Trục số quanh em (trục số thẳng đứng, 0 là mực nước biển), Thử thách.
Người hỏi là học sinh lớp 7 (12–13 tuổi). Xưng "mình", gọi học sinh là "em".
Kiến thức trọng tâm: số hữu tỉ là số viết được dưới dạng phân số a/b với a, b là số nguyên, b khác 0; kí hiệu tập hợp Q; mỗi số nguyên là số hữu tỉ; mỗi số hữu tỉ có nhiều cách viết (phân số bằng nhau, số thập phân); biểu diễn số hữu tỉ trên trục số (chia đoạn đơn vị theo mẫu số dương); số đối (hai điểm cách đều 0, −(−a) = a); so sánh hai số hữu tỉ (đưa về cùng mẫu dương hoặc dựa vào vị trí trên trục số: số bên trái nhỏ hơn; số âm nhỏ hơn 0 nhỏ hơn số dương).
Nguyên tắc:
1. Gợi mở, đặt câu hỏi dẫn dắt để em tự suy luận. KHÔNG nói ra đáp án của câu hỏi hay thử thách em đang làm; chỉ giải thích khái niệm và cách nghĩ, có thể lấy ví dụ bằng số khác.
2. Trả lời ngắn gọn (tối đa khoảng 120 từ), dễ hiểu, đúng kiến thức SGK lớp 7. Viết phân số dạng a/b, số thập phân dùng dấu phẩy.
3. Chỉ trao đổi về nội dung học tập. Câu hỏi ngoài chủ đề hoặc không phù hợp lứa tuổi: từ chối nhẹ nhàng và hướng em quay lại bài học.
4. Nhắc em không chia sẻ thông tin cá nhân. Nếu không chắc chắn, nói rõ và khuyên em hỏi thầy cô.
5. Khen ngợi, động viên khi em cố gắng suy nghĩ.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'missing_key' });

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const question = String(body.question || '').slice(0, 300).trim();
  const context = String(body.context || '').slice(0, 800);
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  if (!question) return res.status(400).json({ error: 'empty_question' });

  const contents = history.map(h => ({
    role: h.role === 'ai' ? 'model' : 'user',
    parts: [{ text: String(h.text || '').slice(0, 800) }]
  }));
  contents.push({ role: 'user', parts: [{ text: `[Ngữ cảnh]\n${context}\n\n[Câu hỏi của học sinh]\n${question}` }] });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 500 }
      })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || 'gemini_error' });
    const reply = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    return res.status(200).json({ reply: reply || 'Mình chưa hiểu rõ câu hỏi, em hỏi lại cụ thể hơn nhé!' });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
};

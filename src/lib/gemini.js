import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export const getAiAdvice = async (noteText, emotion, author) => {
  if (!genAI) {
    return "AI 未配置或密钥无效，请检查 .env.local 中的 VITE_GEMINI_API_KEY。";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `你是一个非常专业且温柔的伴侣情感调解员。现在这对情侣正在进行月度复盘。
其中一方（${author}）提出了一个问题。
Ta的当前情绪是：${emotion}。
Ta原话是这样说的：“${noteText}”

请你给出一小段（约100字）的温柔建议：
1. 先安抚提出问题方的感受。
2. 给出中立的、非评判性的分析。
3. 建议另一方可以怎么回应，或者他们俩可以尝试什么具体的妥协办法。
语气要像知心大姐姐/大哥哥一样温暖。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI 接口出错:", error);
    return "AI 当前在打盹，没能想出建议哦。错误信息：" + error.message;
  }
};

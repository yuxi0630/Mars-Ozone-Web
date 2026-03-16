class AssistantService:

    @staticmethod
    def chat(question: str):
        q = (question or "").strip()

        if "臭氧" in q and "低" in q:
            answer = "火星臭氧浓度偏低可能与大气环流、温度变化、粉尘活动和沙尘暴事件有关。你可以进一步查看沙尘暴专题与差值分析页面。"
        elif "沙尘暴" in q:
            answer = "MY34 年全球性沙尘暴会影响火星大气热结构与光化学过程，通常伴随臭氧浓度异常变化。建议联动查看时间轴和风险评估图。"
        elif "R2" in q or "r2" in q or "MSE" in q or "MAE" in q:
            answer = "R² 反映拟合优度，越接近 1 越好；MSE、MAE 越低越好。你们比赛展示时应同时给出散点图和残差图来证明模型可信度。"
        else:
            answer = "这是火星臭氧智能助手基础版。你可以询问臭氧趋势、沙尘暴影响、模型指标含义或图表解释。"

        return {
            "question": q,
            "answer": answer
        }
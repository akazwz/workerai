import React from "react";

// 定义计划类型
type PlanType = "free" | "pro";

// 定义 Props 类型
interface PlanCardProps {
  planType: PlanType;
  features: string[];
}

const PlanCard: React.FC<PlanCardProps> = ({ planType, features }) => {
  // 根据计划类型定义卡片样式
  const cardStyles =
    planType === "pro" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700";

  // 根据计划类型设定标题
  const title = planType === "pro" ? "Pro Plan" : "Free Plan";

  return (
    <div className={`p-4 rounded-lg shadow-md ${cardStyles}`}>
      <h2 className="text-lg font-bold">{title}</h2>
      <ul className="mt-2">
        {features.map((feature, index) => (
          <li key={index} className="mt-1">
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlanCard;

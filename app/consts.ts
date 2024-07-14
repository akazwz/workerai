export const TextGenerationModels = [
  "@cf/meta/llama-3-8b-instruct",
  "@cf/meta/llama-3-8b-instruct-awq",
  "@cf/qwen/qwen1.5-7b-chat-awq",
  "@cf/qwen/qwen1.5-14b-chat-awq",
];

export type ModelProps = {
  name: string;
  title: string;
  size: string;
  family: string;
  awq: boolean;
  vision: boolean;
  functionCall: boolean;
};

export const models = [
  {
    name: "@cf/meta/llama-3-8b-instruct",
    title: "Llama 8B",
    size: "8B",
    family: "Llama",
    awq: false,
    vision: false,
    functionCall: false,
  },
  {
    name: "@cf/meta/llama-3-8b-instruct-awq",
    title: "Llama 8B AWQ",
    size: "8B",
    family: "Llama",
    awq: true,
    vision: false,
    functionCall: false,
  },
  {
    name: "@cf/qwen/qwen1.5-7b-chat-awq",
    title: "Qwen 7B AWQ",
    size: "7B",
    family: "Qwen",
    awq: true,
    vision: false,
    functionCall: false,
  },
  {
    name: "@cf/qwen/qwen1.5-14b-chat-awq",
    title: "Qwen 14B AWQ",
    size: "14B",
    family: "Qwen",
    awq: true,
    vision: false,
    functionCall: false,
  },
  {
    name: "@hf/nousresearch/hermes-2-pro-mistral-7b",
    title: "Hermes 7B",
    size: "7B",
    family: "Mistral",
    awq: false,
    vision: false,
    functionCall: true,
  },
  {
    name: "@cf/llava-hf/llava-1.5-7b-hf",
    title: "Llava 7B",
    size: "7B",
    family: "Llava",
    awq: false,
    vision: true,
    functionCall: false,
  },
];

export function getShowNameByModelName(name: string): string {
  const model = models.find((model) => model.name === name);
  return model ? model.title : name;
}

export const TextGenerationModelsMap = {
  "@cf/meta/llama-3-8b-instruct": {
    size: "8B",
    family: "Llama",
    awq: false,
    vision: false,
  },
  "@cf/meta/llama-3-8b-instruct-awq": {
    size: "8B",
    family: "Llama",
    awq: true,
    vision: false,
  },
  "@cf/qwen/qwen1.5-7b-chat-awq": {
    size: "7B",
    family: "Qwen",
    awq: true,
    vision: false,
  },
  "@cf/qwen/qwen1.5-14b-chat-awq": {
    size: "14B",
    family: "Qwen",
    awq: true,
    vision: false,
  },
};

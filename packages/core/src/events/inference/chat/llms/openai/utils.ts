import { OpenAI as OpenAIClient } from 'openai';

import {
  BaseMessage,
  ContentLike,
  MessageRole,
} from '../../../../input/load/msgs/base.js';
import { ChatMessage } from '../../../../input/load/msgs/chat.js';

export function isModalityRequiredInMessage(message: BaseMessage): boolean {
  // Multi-modal model does not suport any function/tools
  if (message._role() === 'function') {
    return false;
  }

  const isModalityRequired = (content: ContentLike): boolean => {
    return typeof content !== 'string' && isChatCompletionContentPart(content);
  };

  if (!Array.isArray(message.content)) {
    return isModalityRequired(message.content);
  }

  return message.content.some((content: ContentLike) =>
    isModalityRequired(content)
  );
}

export function isChatCompletionContentPart(
  partLike: any
): partLike is OpenAIClient.ChatCompletionContentPart {
  return (
    typeof partLike === 'object' &&
    (isChatCompletionContentPartImage(partLike) ||
      isChatCompletionContentPartText(partLike))
  );
}

export function isChatCompletionContentPartImage(
  partLike: any
): partLike is OpenAIClient.ChatCompletionContentPartImage {
  return (
    typeof partLike === 'object' &&
    'type' in partLike &&
    partLike['type'] === 'image_url' &&
    'image_url' in partLike &&
    isOpenAIChatImageURL(partLike['image_url'])
  );
}

export function isOpenAIChatImageURL(
  imageUrlLike: any
): imageUrlLike is OpenAIClient.ChatCompletionContentPartImage.ImageURL {
  if (typeof imageUrlLike !== 'object') return false;

  if (
    'detail' in imageUrlLike &&
    !['auto', 'low', 'high'].includes(imageUrlLike['detail'])
  ) {
    return false;
  }

  return 'url' in imageUrlLike && typeof imageUrlLike['url'] === 'string';
}

export function isChatCompletionContentPartText(
  partLike: any
): partLike is OpenAIClient.ChatCompletionContentPartText {
  return (
    typeof partLike === 'object' &&
    'type' in partLike &&
    partLike['type'] === 'text' &&
    'text' in partLike &&
    typeof partLike['text'] === 'string'
  );
}

export function isChatCompletionMessageToolCall(
  toolLike: any
): toolLike is OpenAIClient.ChatCompletionMessageToolCall {
  return (
    typeof toolLike === 'object' &&
    'type' in toolLike &&
    toolLike['type'] === 'function' &&
    'id' in toolLike &&
    typeof toolLike['id'] === 'string' &&
    'function' in toolLike &&
    isOpenAIFunction(toolLike['function'])
  );
}

export function isOpenAIFunction(
  functionLike: any
): functionLike is OpenAIClient.ChatCompletionMessageToolCall.Function {
  return (
    typeof functionLike === 'object' &&
    'name' in functionLike &&
    typeof functionLike['name'] === 'string' &&
    /**
     * The following description is the description of `arguments`:
     *
     * The arguments to call the function with, as generated by the model in JSON
     * format. Note that the model does not always generate valid JSON, and may
     * hallucinate parameters not defined by your function schema. Validate the
     * arguments in your code before calling your function.
     *
     * It seems that this parameter is containing a JSON object, even the type is string.
     * So we allow object type in this parameter, but we will convert it to string before
     * calling the model API.
     */
    'arguments' in functionLike &&
    (typeof functionLike['arguments'] === 'string' ||
      typeof functionLike['arguments'] === 'object')
  );
}

export function getContentFromMessage(
  message: BaseMessage
): OpenAIClient.Chat.ChatCompletionMessageParam {
  const role: MessageRole = message._role();

  const getContentWithRole = (
    message: BaseMessage,
    role: string
  ): OpenAIClient.Chat.ChatCompletionMessageParam => {
    if (role === 'system') {
      return {
        role,
        name: message.name,
        content: coerceMessageContentToString(message.content),
      };
    } else if (role === 'human') {
      return {
        role: 'user',
        name: message.name,
        content:
          typeof message.content === 'string'
            ? message.content
            : getPartsFromMessageContent(message.content),
      };
    } else if (role === 'assistant') {
      return {
        role,
        name: message.name,
        content: coerceMessageContentToString(message.content),
        tool_calls: getToolCallsFromMessageKwargs(message.additionalKwargs),
      };
    } else if (role === 'function') {
      return {
        role: 'tool',
        content: coerceMessageContentToString(message.content),
        tool_call_id: getToolCallIdFromMessageKwargs(message.additionalKwargs),
      };
    }

    throw new Error(`CANNOT get OpenAIChat content because of role: ${role}`);
  };

  if (role !== 'general') {
    return getContentWithRole(message, role);
  }

  const generalMessage = message as ChatMessage;
  if (
    ['human', 'assistant', 'system', 'function'].includes(generalMessage.role)
  ) {
    return getContentWithRole(generalMessage, generalMessage.role);
  }

  return getContentWithRole(generalMessage, 'human');
}

export function isJSONInContent(content: string): boolean {
  try {
    JSON.parse(content);
    return true;
  } catch (e) {
    console.warn('content is not JSON');
  }

  return false;
}

export function formatJSONInContent(
  content: string
): Record<string, unknown> | null {
  try {
    return JSON.parse(content);
  } catch (e) {
    console.warn('content is not JSON, cannot format');
  }

  return null;
}

export function formatJSONStringInContent(content: string): string {
  try {
    JSON.parse(content);
    return formatArguments(content);
  } catch (e) {
    console.warn('content is not JSON, cannot format arguments');
  }

  return content;
}

export function formatArguments(args: string): string {
  const lines: string[] = [];

  lines.push('{');
  const json = JSON.parse(args);

  const properties: string[] = [];
  for (const fieldName of Object.keys(json)) {
    properties.push(`"${fieldName}":${formatValue(json[fieldName])}`);
  }

  lines.push(properties.join(',\n'));
  lines.push('}');

  return lines.join('\n');
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number') {
    return `${value}`;
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => formatValue(v)).join(',')}]`;
  }
  return '""';
}

function coerceMessageContentToString(
  content: ContentLike | ContentLike[]
): string {
  const coerceSingleContentLikeToString = (content: ContentLike): string => {
    if (typeof content === 'string') {
      return content;
    }

    return JSON.stringify(content, null, 2);
  };

  if (Array.isArray(content)) {
    return content.map((c) => coerceSingleContentLikeToString(c)).join('\n\n');
  }

  return coerceSingleContentLikeToString(content);
}

function getPartsFromMessageContent(
  content: ContentLike | ContentLike[]
): Array<OpenAIClient.ChatCompletionContentPart> {
  const getPart = (
    content: ContentLike
  ): OpenAIClient.ChatCompletionContentPart => {
    if (typeof content === 'string') {
      return {
        type: 'text',
        text: content,
      };
    } else if (isChatCompletionContentPartText(content)) {
      return content;
    } else if (isChatCompletionContentPartImage(content)) {
      return content;
    }

    throw new Error('Message is not valid for OpenAIChat');
  };

  if (!Array.isArray(content)) {
    return [getPart(content)];
  }

  return content.map((content: ContentLike) => getPart(content));
}

function getToolCallsFromMessageKwargs(
  additionalKwargs: Record<string, unknown> | undefined
): Array<OpenAIClient.ChatCompletionMessageToolCall> {
  if (
    additionalKwargs === undefined ||
    !('tool_calls' in additionalKwargs) ||
    !Array.isArray(additionalKwargs['tool_calls'])
  ) {
    return [];
  }

  if (
    additionalKwargs['tool_calls'].every((tc) =>
      isChatCompletionMessageToolCall(tc)
    )
  ) {
    return additionalKwargs['tool_calls'].map((tc) => ({
      ...tc,
      function: {
        ...tc.function,
        arguments:
          typeof tc.function.arguments === 'object'
            ? JSON.stringify(tc.function.arguments, null, 2)
            : tc.function.arguments,
      },
    }));
  }

  throw new Error('Message kwarg `tool_calls` is not valid for OpenAIChat');
}

function getToolCallIdFromMessageKwargs(
  additionalKwargs: Record<string, unknown> | undefined
) {
  if (
    additionalKwargs === undefined ||
    !('tool_call_id' in additionalKwargs) ||
    !(typeof additionalKwargs['tool_call_id'] === 'string')
  ) {
    console.warn(
      'Function message does not have a `tool_call_id` in OpenAI ToolMessage'
    );

    return '';
  }

  return additionalKwargs['tool_call_id'];
}

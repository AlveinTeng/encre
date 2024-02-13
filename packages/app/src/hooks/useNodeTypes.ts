import { chatNodeDescriptor } from '../components/nodes/ChatNode';
import { imageNodeDescriptor } from '../components/nodes/ImageNode';
import { jsonNodeDescriptor } from '../components/nodes/JsonNode';
import { textNodeDescriptor } from '../components/nodes/TextNode';
import { Node } from '../types/node.type';
import {
  NodeContent,
  NodeContentDescriptors,
  NodeContentType,
  UnknownNodeContentDescriptor,
} from '../types/nodecontent.type';

export function getNodeContentTypes(): Array<NodeContentType> {
  return ['text', 'chat', 'image', 'json'];
}

const descriptors: Partial<NodeContentDescriptors> = {
  text: textNodeDescriptor,
  chat: chatNodeDescriptor,
  image: imageNodeDescriptor,
  json: jsonNodeDescriptor,
};

export function useNodeTypes(): NodeContentDescriptors {
  const allNodeTypes = getNodeContentTypes();

  return Object.fromEntries(
    allNodeTypes.map((nodeType) => {
      const descriptor = descriptors[nodeType] ?? {};

      return [nodeType, descriptor];
    }),
  ) as NodeContentDescriptors;
}

export function useUnknownNodeContentDescriptor(
  node: Node,
): UnknownNodeContentDescriptor {
  const nodeDescriptors: NodeContentDescriptors = useNodeTypes();

  return (nodeDescriptors[node.type as NodeContentType] ??
    {}) as UnknownNodeContentDescriptor;
}
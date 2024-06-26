import { BasePrompt } from '../../../events/input/load/prompts/base.js';
import { ChatPrompt } from '../../../events/input/load/prompts/chat.js';
import { StringPrompt } from '../../../events/input/load/prompts/text.js';
import { getRecordId } from '../../../utils/nanoid.js';
import { scalarDefaults } from '../../data.js';
import {
  ProcessContext,
  ProcessInputMap,
  ProcessOutputMap,
} from '../../processor.js';
import { coerceToData } from '../../utils/coerce.js';
import { NodeImpl } from '../base.js';
import { SerializableNode } from '../index.js';

export type PromptNode = SerializableNode<'prompt', BasePrompt>;

export abstract class PromptNodeImpl extends NodeImpl<PromptNode> {
  async process(
    inputs: ProcessInputMap | undefined,
    context: ProcessContext
  ): Promise<ProcessOutputMap> {
    if (!this.validateInputs(inputs)) {
      throw new Error(`${this.type} Node ${this.title} has invalid inputs`);
    }

    // TODO: This depends on the connected input type,
    // since the output types can be different.
    return { prompt: coerceToData(this.data.toChatMessages()) };
  }
}

export class StringPromptNodeImpl extends PromptNodeImpl {
  static nodeFrom(serializable: StringPrompt): PromptNode {
    return {
      id: getRecordId(),
      type: 'prompt',
      subType: 'string',
      data: serializable,
      visualInfo: {
        position: {
          x: 0,
          y: 0,
        },
        size: {
          width: 300,
          height: 500,
        },
      },
      inputs: {},
      outputs: {
        prompt: ['string', 'chat-message[]'],
      },
    };
  }

  static create(): PromptNode {
    const stringPrompt = new StringPrompt(scalarDefaults['string']);

    const node: PromptNode = StringPromptNodeImpl.nodeFrom(stringPrompt);

    return node;
  }
}

export class ChatPromptNodeImpl extends PromptNodeImpl {
  static nodeFrom(serializable: ChatPrompt): PromptNode {
    return {
      id: getRecordId(),
      type: 'prompt',
      subType: 'chat',
      data: serializable,
      visualInfo: {
        position: {
          x: 0,
          y: 0,
        },
        size: {
          width: 300,
          height: 500,
        },
      },
      inputs: {},
      outputs: {
        prompt: ['string', 'chat-message[]'],
      },
    };
  }

  static create(): PromptNode {
    const chatPrompt = new ChatPrompt([]);

    const node: PromptNode = ChatPromptNodeImpl.nodeFrom(chatPrompt);

    return node;
  }
}

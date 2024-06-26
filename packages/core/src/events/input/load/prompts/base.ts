import { Serializable } from '../../../../load/serializable.js';
import { CallableConfig } from '../../../../record/callable.js';
import { BaseEvent, BaseEventParams } from '../../../base.js';
import { ValidateResult } from '../../../inference/validate/index.js';
import {
  VariableRules,
  VariableValidator,
} from '../../../inference/validate/validators/variable.js';
import { BaseMessage } from '../msgs/base.js';

export abstract class BasePrompt extends Serializable {
  _isSerializable = false;

  _namespace: string[] = [
    'events',
    'input',
    'load',
    'prompts',
    this._promptType(),
  ];

  abstract _promptType(): string;

  abstract toString(): string;

  abstract toChatMessages(): BaseMessage[];
}

export interface PromptTemplateParams extends BaseEventParams {
  /**
   * the template string
   */
  template: string;

  /**
   * Clearly declare the input variables inside the template
   */
  inputVariables: string[];

  guardrails?: VariableRules;
}

export interface BasePromptTemplateInput {
  [key: string]: unknown;
}

export abstract class BasePromptTemplate<
    CallInput extends BasePromptTemplateInput = BasePromptTemplateInput,
    CallOutput extends BasePrompt = BasePrompt,
    CallOptions extends CallableConfig = CallableConfig,
  >
  extends BaseEvent<CallInput, CallOutput, CallOptions>
  implements PromptTemplateParams
{
  static _name(): string {
    return 'BasePromptTemplate';
  }

  _eventNamespace(): string[] {
    return ['input', 'load', 'prompts', this._templateType()];
  }

  template = '';

  inputVariables: string[] = [];

  guardrails?: VariableRules;

  constructor(fields?: Partial<PromptTemplateParams>) {
    super(fields ?? {});

    this.template = fields?.template ?? this.template;

    this.inputVariables = fields?.inputVariables ?? this.inputVariables;

    this.guardrails = fields?.guardrails;

    if (this.template && this.inputVariables) {
      this._isInputExists(this.template, this.inputVariables);
    }
  }

  abstract _templateType(): string;

  /**
   * To validate whether the inputVariables is valid
   * @param template
   * @param inputVariables
   */
  private _isInputExists(template: string, inputVariables: string[]): void {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    let match: RegExpExecArray | null;
    const foundVariables: Set<string> = new Set();

    while ((match = variablePattern.exec(template)) !== null) {
      foundVariables.add(match[1]);
    }

    inputVariables.forEach((variable) => {
      if (!foundVariables.has(variable)) {
        throw new Error(
          `Variable '${variable}' is declared but not used in the template.`
        );
      }
    });
  }

  async invoke(
    input: CallInput,
    options?: Partial<CallOptions>
  ): Promise<CallOutput> {
    const validateResult = await this.validate(input);

    if (!validateResult.isValid) {
      throw new Error(
        `CANNOT format prompt because of error - ${validateResult.errorMessage}`
      );
    }

    return this.formatPrompt(input);
  }

  async validate(input: CallInput): Promise<ValidateResult> {
    if (!this.guardrails) return { isValid: true };

    const validator = new VariableValidator({
      variables: this._getAllVariables(),
      rules: this.guardrails,
    });

    return validator.invoke(input);
  }

  abstract format(input: CallInput): Promise<string>;

  abstract formatPrompt(input: CallInput): Promise<CallOutput>;

  private _getAllVariables(): string[] {
    return [...new Set(this.inputVariables)];
  }
}

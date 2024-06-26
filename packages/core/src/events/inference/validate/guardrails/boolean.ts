import { SerializedRule } from '../../../../studio/serde.js';
import { BaseRule } from './base.js';

/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */
export class BooleanRule<T extends unknown = boolean> extends BaseRule<T> {
  _isSerializable = true;

  static _name(): string {
    return 'BooleanRule';
  }

  _ruleType(): 'boolean' {
    return 'boolean';
  }

  concat<U>(rule: BaseRule<U>, conjunction: 'or' | 'and'): BaseRule<T | U> {
    return new BooleanRule<T | U>({
      description: BooleanRule._mergeDescription(
        this as BaseRule,
        rule as BaseRule,
        conjunction
      ),
      variables: BooleanRule._mergeVariables(
        this as BaseRule,
        rule as BaseRule
      ),
      func: BooleanRule._mergeFunc(
        this as BaseRule,
        rule as BaseRule,
        conjunction
      ),
      metadata: BooleanRule._mergeMetadata(
        this as BaseRule,
        rule as BaseRule,
        conjunction
      ),
    });
  }

  static async deserialize(
    serialized: SerializedRule,
    values?: Record<string, unknown>
  ): Promise<BooleanRule<boolean>> {
    const booleanRuleFields = {
      description: serialized.description,
      func: serialized.func,
      variables: {
        ...serialized.variables,
        ...values,
      },
    };

    return new BooleanRule(booleanRuleFields);
  }

  static exists() {
    return new BooleanRule<boolean | undefined>({
      description: 'exists',
      func: async (input: boolean | undefined) => {
        return input !== undefined;
      },
    });
  }

  static doesNotExist() {
    return new BooleanRule<boolean | undefined>({
      description: 'does not exist',
      func: async (input: boolean | undefined) => {
        return input === undefined;
      },
    });
  }

  static isEqual(value?: boolean) {
    return new BooleanRule<boolean>({
      description: 'is equal to {{value}}',
      variables: { value },
      func: async (input: boolean, variables: { value: boolean }) => {
        return input === variables.value;
      },
    });
  }

  static isNotEqual(value?: boolean) {
    return new BooleanRule<boolean>({
      description: 'is not equal to {{value}}',
      variables: { value },
      func: async (input: boolean, variables: { value: boolean }) => {
        return input !== variables.value;
      },
    });
  }

  static isTrue() {
    return new BooleanRule<boolean>({
      description: 'is true',
      func: async (input: boolean) => {
        return input === true;
      },
    });
  }

  static isFalse() {
    return new BooleanRule<boolean>({
      description: 'is false',
      func: async (input: boolean) => {
        return input === false;
      },
    });
  }
}

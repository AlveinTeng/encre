import { v4 as uuidv4 } from 'uuid';

import { shallowCopy } from '../utils/copy.js';
import { getRecordId, IdProvider } from '../utils/nanoid.js';
// import { nanoid } from 'nanoid';
import {
  type SerializedKeyAlias,
  type SecretFields,
  type SerializedFields,
  mapKeys,
  keyToJson,
  type EventSerializedFields,
  type TemplateSerializedFields,
  mapKeyTypes,
  RecordType,
  type RecordId,
} from './keymap.js';

export enum SerializableType {
  RECORD = 'record',
  MODULE = 'module',
}

export type BasedSerialized<T extends string> = {
  _grp: number;
  _type: T;
  _id: string[];
};

export interface SerializedConstructor extends BasedSerialized<'constructor'> {
  _kwargs: SerializedFields;
}

export interface SerializedSecret extends BasedSerialized<'secret'> {}

export interface SerializedNotImplemented
  extends BasedSerialized<'not_implemented'> {}

export interface SerializedErrnoRecord extends BasedSerialized<'errno_record'> {
  _recordId: RecordId;
}

export interface SerializedInputRecord extends BasedSerialized<'input_record'> {
  _recordId: RecordId;
  _kwargs: SerializedFields;
}

export interface SerializedOutputRecord
  extends BasedSerialized<'output_record'> {
  _recordId: RecordId;
  _kwargs: SerializedFields;
}

export interface SerializedSecretRecord
  extends BasedSerialized<'secret_record'> {
  _recordId: RecordId;
}

export interface SerializedEventRecord extends BasedSerialized<'event_record'> {
  _recordId: RecordId;
  _kwargs: SerializedFields;
  _metadata: EventSerializedFields;
}

export interface SerializedTemplateRecord
  extends BasedSerialized<'template_record'> {
  _recordId: RecordId;
  _metadata: TemplateSerializedFields;
}

export type SerializedRecord =
  | SerializedErrnoRecord
  | SerializedInputRecord
  | SerializedOutputRecord
  | SerializedSecretRecord
  | SerializedEventRecord
  | SerializedTemplateRecord;

export type Serialized =
  | SerializedConstructor
  | SerializedSecret
  | SerializedNotImplemented
  | SerializedRecord;



export function safeAssign<T extends object>(target: T, source: T): T {
  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) {
      target[key] = source[key];
    }
  }

  return target;
}

export abstract class Serializable {
  _isSerializable = false;

  _kwargs: SerializedFields;

  abstract _namespace: string[];

  static _name(): string {
    return this.name;
  }

  get _id(): string[] {
    return [
      ...this._namespace,
      getUniqueName(this.constructor as typeof Serializable),
    ];
  }

  get _secrets(): SecretFields | undefined {
    return undefined;
  }

  get _attributes(): SerializedFields | undefined {
    return undefined;
  }

  get _aliases(): SerializedFields | undefined {
    return undefined;
  }

  protected _recordId: RecordId;

  constructor(kwargs?: object, ..._args: never[]) {
    this._kwargs = toSerializedFields(kwargs || {});
    this._recordId = getRecordId();
  }

  protected _initKwargs(): SerializedFields {
    return Object.keys(this._kwargs).reduce((accumulator, key) => {
      accumulator[key] =
        key in this ? this[key as keyof this] : this._kwargs[key];

      return accumulator;
    }, {} as SerializedFields);
  }

  protected _replaceSecret(
    root: SerializedFields,
    secretsMap: SecretFields
  ): SerializedFields {
    const result: SerializedFields = shallowCopy(root);

    for (const [path, secretKey] of Object.entries(secretsMap)) {
      const [last, ...partsReverse] = path.split('.').reverse();

      let current: SerializedFields = result;
      for (const key of partsReverse.reverse()) {
        if (current[key] === undefined) {
          break;
        }

        current[key] = shallowCopy(current[key] as SerializedFields);
        current = current[key] as SerializedFields;
      }

      if (current[last] !== undefined) {
        current[last] = this.toJSONSecret(secretKey);
      }
    }

    return result;
  }

  protected _removeSecret(
    root: SerializedFields,
    secretsMap: SecretFields
  ): SerializedFields {
    const result: SerializedFields = shallowCopy(root);

    for (const [path, secretKey] of Object.entries(secretsMap)) {
      const [last, ...partsReverse] = path.split('.').reverse();

      let current: SerializedFields = result;
      for (const key of partsReverse.reverse()) {
        if (current[key] === undefined) {
          break;
        }

        current[key] = shallowCopy(current[key] as SerializedFields);
        current = current[key] as SerializedFields;
      }

      if (current[last] !== undefined) {
        if (path.split('.').length > 1) {
          delete result[path.split('.')[0]];
        } else {
          delete current[last];
        }
      }
    }

    return result;
  }

  protected async _getSecretRecord(
    root: SerializedFields,
    secretsMap: SecretFields
  ): Promise<SerializedFields> {
    const result: SerializedFields = shallowCopy(root);
    const secretKeys: string[] = [];

    for (const [path, secretKey] of Object.entries(secretsMap)) {
      const [last, ...partsReverse] = path.split('.').reverse();

      let current: SerializedFields = result;
      for (const key of partsReverse.reverse()) {
        if (current[key] === undefined) {
          break;
        }

        current[key] = shallowCopy(current[key] as SerializedFields);
        current = current[key] as SerializedFields;
      }

      if (current[last] !== undefined) {
        secretKeys.push(secretKey);
      }
    }

    return (
      secretKeys.length > 0 ? await this.toSecretRecord(secretKeys) : {}
    ) as SerializedFields;
  }

  protected _getAttributes(): {
    aliases: SerializedKeyAlias;
    secrets: SecretFields;
    kwargs: SerializedFields;
  } {
    let aliases: SerializedKeyAlias = {};
    let secrets: SecretFields = {};
    let kwargs: SerializedFields = this._initKwargs();

    for (
      let sub = Object.getPrototypeOf(this);
      sub;
      sub = Object.getPrototypeOf(sub)
    ) {
      aliases = safeAssign<SerializedKeyAlias>(
        aliases,
        Reflect.get(sub, '_aliases', this)
      );
      secrets = safeAssign<SecretFields>(
        secrets,
        Reflect.get(sub, '_secrets', this)
      );
      kwargs = safeAssign<SerializedFields>(
        kwargs,
        Reflect.get(sub, '_attributes', this)
      );
    }

    Object.keys(secrets).forEach((keyPath: string) => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias, @typescript-eslint/no-explicit-any
      let read: Serializable = this;
      let write: SerializedFields = kwargs;

      const [last, ...partsReverse] = keyPath.split('.').reverse();
      for (const key of partsReverse.reverse()) {
        if (!(key in read) || read[key] === undefined) return;

        if (!(key in write) || write[key] === undefined) {
          if (typeof read[key] === 'object' && read[key] != null) {
            write[key] = {};
          } else if (Array.isArray(read[key])) {
            write[key] = [];
          }
        }

        read = read[key];
        write = write[key] as SerializedFields;
      }

      if (last in read && read[last] !== undefined) {
        write[last] = write[last] || read[last];
      }
    });

    return { aliases, secrets, kwargs };
  }

  getAttributes(): {
    aliases: SerializedKeyAlias;
    secrets: SecretFields;
    kwargs: SerializedFields;
  } {
    const { aliases, secrets, kwargs } = this._getAttributes();

    const filteredKwargs = Object.keys(secrets).length
      ? this._removeSecret(kwargs, secrets)
      : kwargs;

    return { aliases, secrets, kwargs: filteredKwargs };
  }

  toJSONNotImplemented(): Serialized {
    return {
      _grp: 1,
      _type: 'not_implemented',
      _id: this._id,
    };
  }

  toJSONSecret(secretKey: string): Serialized {
    return {
      _grp: 1,
      _type: 'secret',
      _id: [secretKey],
    };
  }

  toJSONConstructor(
    aliases: SerializedKeyAlias,
    secrets: SecretFields,
    kwargs: SerializedFields
  ): Serialized {
    return {
      _grp: 1,
      _type: 'constructor',
      _id: this._id,
      _kwargs: mapKeys(
        Object.keys(secrets).length
          ? this._replaceSecret(kwargs, secrets)
          : kwargs,
        keyToJson,
        aliases
      ),
    };
  }

  async toJSONErrnoRecord(): Promise<Serialized> {
    return {
      _grp: 2,
      _type: 'errno_record',
      _id: this._id,
      _recordId: this._recordId,
    };
  }

  async toSecretRecord(secretKey: string | string[]): Promise<Serialized> {
    return {
      _grp: 2,
      _type: 'secret_record',
      _id: [...secretKey],
      _recordId: this._recordId,
    };
  }

  async toInputRecord(
    aliases: SerializedKeyAlias,
    secrets: SecretFields,
    kwargs: SerializedFields
  ): Promise<Serialized> {
    return {
      _grp: 2,
      _type: 'input_record',
      _id: this._id,
      _recordId: this._recordId,
      _kwargs: mapKeyTypes(
        Object.keys(secrets).length
          ? this._removeSecret(kwargs, secrets)
          : kwargs,
        keyToJson,
        aliases
      ),
    };
  }

  async toOutputRecord(
    aliases: SerializedKeyAlias,
    secrets: SecretFields,
    kwargs: SerializedFields
  ): Promise<Serialized> {
    return {
      _grp: 2,
      _type: 'output_record',
      _id: this._id,
      _recordId: this._recordId,
      _kwargs: mapKeyTypes(
        Object.keys(secrets).length
          ? this._removeSecret(kwargs, secrets)
          : kwargs,
        keyToJson,
        aliases
      ),
    };
  }

  async toEventRecord(
    aliases: SerializedKeyAlias,
    secrets: SecretFields,
    kwargs: SerializedFields,
    outputs: unknown | SerializedFields,
    parent?: RecordId
  ): Promise<Serialized> {
    let serializedOutputs: SerializedFields;
    if (typeof outputs === 'object') {
      serializedOutputs = (outputs ?? {}) as SerializedFields;
    } else {
      serializedOutputs = (outputs ? { outputs } : {}) as SerializedFields;
    }

    return {
      _grp: 2,
      _type: 'event_record',
      _id: this._id,
      _recordId: this._recordId,
      _kwargs: mapKeys(
        Object.keys(secrets).length
          ? this._replaceSecret(kwargs, secrets)
          : kwargs,
        keyToJson,
        aliases
      ),
      _metadata: {
        _recordType: RecordType.EVENT,
        _secrets: await this._getSecretRecord(kwargs, secrets),
        _inputs: (await this.toInputRecord(
          aliases,
          secrets,
          kwargs
        )) as SerializedFields,
        _outputs: (await this.toOutputRecord(
          aliases,
          secrets,
          serializedOutputs
        )) as SerializedFields,
        _parent: parent,
      },
    };
  }

  async toTemplateRecord(children?: RecordId[]): Promise<Serialized> {
    return {
      _grp: 2,
      _type: 'template_record',
      _id: this._id,
      _recordId: this._recordId,
      _metadata: {
        _recordType: RecordType.TEMPLATE,
        _children: children ?? [],
      },
    };
  }

  async toRecord(
    outputs?: unknown | SerializedFields,
    parent?: RecordId
  ): Promise<Serialized> {
    if (!this._isSerializable) {
      return this.toJSONErrnoRecord();
    }

    if (
      this._kwargs instanceof Serializable ||
      typeof this._kwargs !== 'object' ||
      Array.isArray(this._kwargs)
    ) {
      return this.toJSONErrnoRecord();
    }

    const { aliases, secrets, kwargs } = this._getAttributes();

    return this.toEventRecord(aliases, secrets, kwargs, outputs, parent);
  }

  toJSON(): Serialized {
    if (!this._isSerializable) {
      return this.toJSONNotImplemented();
    }

    if (
      this._kwargs instanceof Serializable ||
      typeof this._kwargs !== 'object' ||
      Array.isArray(this._kwargs)
    ) {
      return this.toJSONNotImplemented();
    }

    const { aliases, secrets, kwargs } = this._getAttributes();

    return this.toJSONConstructor(aliases, secrets, kwargs);
  }
}

export function getUniqueName(serializableClass: typeof Serializable): string {
  const parentClass = Object.getPrototypeOf(serializableClass);
  const isSubclassed =
    typeof serializableClass._name === 'function' &&
    (typeof parentClass._name !== 'function' ||
      serializableClass._name !== parentClass._name);

  if (isSubclassed) return serializableClass._name();

  return serializableClass.name;
}

export function toSerializedFields<T>(input: T): SerializedFields {
  return input as SerializedFields;
}

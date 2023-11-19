import fs from 'fs';
import path from 'path';
import url from 'url';
import { expect, test } from '@jest/globals';
import { stringify } from 'yaml';
import { Context } from '../../../load/docs/context.js';
import { RecursiveTextSplitter } from '../../splitter.js';

test('RecursiveTextSplitter from cpp', async () => {
  const splitter: RecursiveTextSplitter = RecursiveTextSplitter.fromLanguage(
    'cpp',
    {
      maxSize: 200,
      overlap: 50,
    }
  );

  const filePath: string = path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    '../examples/cpp.txt'
  );

  const fdr: string = fs.readFileSync(filePath, {
    encoding: 'utf8',
    flag: 'r',
  });

  const context = new Context({
    pageContent: fdr,
  });

  const newContexts = await splitter.invoke(context);
  expect(stringify(newContexts.map((c) => c.pageContent))).toMatchSnapshot();
  expect(stringify(newContexts.map((c) => c.metadata))).toMatchSnapshot();

  type Loc = {
    lines: {
      from: number;
      to: number;
    };
  };

  expect(
    newContexts
      .map((c) => {
        const loc: Loc = c.metadata.loc as unknown as Loc;
        return (
          fdr
            .split('\n')
            .slice(loc.lines.from - 1, loc.lines.to)
            .join('\n')
            .trim() === c.pageContent
        );
      })
      .every((e) => e === true)
  ).toBeTruthy();
});

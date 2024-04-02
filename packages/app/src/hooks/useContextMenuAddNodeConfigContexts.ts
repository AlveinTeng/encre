import { useMemo } from 'react';

import { orderBy } from 'lodash-es';

import { typeOf } from '../utils/safeTypes';

export function useContextMenuAddNodeConfigContexts() {
  // TODO: get those from globalRegisteration
  const nodeTypePairs = {
    loader: ['pdf'],
    message: ['chat', 'human', 'bot', 'prompt', 'function'],
    prompt: ['string', 'chat'],
    splitter: [
      'text',
      'paragraph',
      'token',
      'cpp',
      'go',
      'java',
      'js',
      'php',
      'proto',
      'python',
      'rst',
      'ruby',
      'rust',
      'scala',
      'markdown',
      'latex',
      'html',
      'sol',
    ],
    llm: ['openai', 'gemini'],
    chatlm: ['openai', 'gemini'],
  };

  const avaliableNodes = useMemo(() => {
    const groups = Object.entries(nodeTypePairs).map(([type, subTypes]) => {
      let subTypeContextItems = subTypes.map((subType) => ({
        id: `add-node:${type}-${subType}`,
        name: subType,
        // TODO: need to find the registerArgs here
        data: {
          nodeType: type,
          nodeSubType: subType,
        },
      }));

      subTypeContextItems = orderBy(subTypeContextItems, (item) => item.name);

      const metadata = { label: type };

      return {
        id: `add-node-${type}`,
        name: type,
        contexts:
          subTypeContextItems.length > 0
            ? [
                {
                  metadata,
                  items: subTypeContextItems,
                },
              ]
            : [],
      };
    });

    return groups.filter((grp) => grp.contexts.length > 0);
  }, []);

  return avaliableNodes;
}

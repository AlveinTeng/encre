import { useMemo } from 'react';

import { css } from '@emotion/react';
import { Abc, Cabin } from '@mui/icons-material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ContentPasteRoundedIcon from '@mui/icons-material/ContentPasteRounded';
import CropSquareOutlinedIcon from '@mui/icons-material/CropSquareOutlined';
import SquareRoundedIcon from '@mui/icons-material/SquareRounded';

import { useContextMenuAddNodeConfigContexts } from './useContextMenuAddNodeConfigContexts';
import { useContextMenuChangeCommentColorConfigContexts } from './useContextMenuChangeCommentColorConfigContexts';
import { useHotKeyDisplay } from './useHotKeyDisplay';
import { ContextMenuConfigContexts } from '../types/contextmenu.type';
import { HOTKEY } from '../types/hotkey.type';
import { typeOf } from '../utils/safeTypes';

export function useContextMenuConfigContexts(): ContextMenuConfigContexts {
  const avaliableNodes = useContextMenuAddNodeConfigContexts();
  const commentColors = useContextMenuChangeCommentColorConfigContexts();

  const contexts: ContextMenuConfigContexts = useMemo(
    () => ({
      comment: {
        contextType: typeOf<{
          commentId: string;
        }>(),
        group: [
          {
            metadata: {
              label: 'edit',
            },
            items: [
              {
                id: 'duplicate-comment',
                name: 'Duplicate comment',
                tip: useHotKeyDisplay([HOTKEY.CTRL, 'D']),
              },
              {
                id: 'copy-comment',
                name: 'Copy comment',
                tip: useHotKeyDisplay([HOTKEY.CTRL, 'C']),
              },
              {
                id: 'paste-comment',
                name: 'Paste comment',
                tip: useHotKeyDisplay([HOTKEY.CTRL, 'V']),
              },
            ],
          },
          {
            metadata: {
              label: 'modify',
            },
            items: [
              {
                id: 'change-background-color',
                name: 'Change background color',
                contexts: [
                  {
                    metadata: {
                      label: 'type',
                    },
                    items: commentColors,
                  },
                ],
              },
            ],
          },
        ],
      },
      node: {
        contextType: typeOf<{
          nodeId: string;
          nodeType: string;
          nodeSubType: string;
          registerArgs?: Record<string, unknown>;
        }>(),
        group: [
          {
            metadata: {
              label: 'edit',
            },
            items: [
              {
                id: 'duplicate-node',
                name: 'Duplicate node',
                tip: useHotKeyDisplay([HOTKEY.CTRL, 'D']),
              },
              {
                id: 'copy-node',
                name: 'Copy node',
                tip: useHotKeyDisplay([HOTKEY.CTRL, 'C']),
              },
              {
                id: 'paste-node',
                name: 'Paste node',
                tip: useHotKeyDisplay([HOTKEY.CTRL, 'V']),
              },
              {
                id: 'delete-node',
                name: 'Delete node',
                tip: useHotKeyDisplay(['Del']),
              },
              {
                id: 'select-all-node',
                name: 'Select all nodes',
                tip: useHotKeyDisplay([HOTKEY.CTRL, 'A']),
              },
            ],
          },
          {
            metadata: {
              label: 'view',
            },
            items: [
              {
                id: 'bring-to-front',
                name: 'Bring to front',
                tip: ']',
              },
              {
                id: 'send-to-back',
                name: 'Send to back',
                tip: '[',
              },
            ],
          },
          {
            metadata: {
              label: 'display',
            },
            items: [
              {
                id: 'collapse-expand-node',
                name: 'Collapse/Expand',
                tip: useHotKeyDisplay([HOTKEY.CTRL, HOTKEY.SHIFT, 'H']),
              },
              {
                id: 'pin-unpin-node',
                name: 'Pin/Unpin',
                tip: useHotKeyDisplay([HOTKEY.CTRL, HOTKEY.SHIFT, 'L']),
              },
            ],
          },
          {
            metadata: {
              label: 'group',
            },
            items: [
              {
                id: 'group-node',
                name: 'Group with comment',
                tip: useHotKeyDisplay([HOTKEY.CTRL, 'G']),
              },
            ],
          },
          {
            metadata: {
              label: 'deactive',
            },
            items: [
              {
                id: 'active-deactive-node',
                name: 'Deactive/Active',
              },
            ],
          },
          {
            metadata: {
              label: 'modify',
            },
            items: [
              {
                id: 'default-node',
                name: 'Set default values',
              },
              {
                id: 'change-background-color',
                name: 'Change background color',
              },
            ],
          },
        ],
      },
      wire: {
        contextType: typeOf<Record<string, never>>(),
        group: [
          {
            metadata: {
              label: 'wire',
            },
            items: [
              {
                id: 'change-wire-type',
                name: 'Change wire type',
                contexts: [
                  {
                    metadata: {
                      label: 'type',
                    },
                    items: [
                      {
                        id: 'change-wire-type:adaptive-bezier',
                        name: 'Adaptive Bezier',
                        data: {
                          wireType: 'adaptive-bezier',
                        },
                      },
                      {
                        id: 'change-wire-type:bezier',
                        name: 'Bezier',
                        data: {
                          wireType: 'bezier',
                        },
                      },
                      {
                        id: 'change-wire-type:smooth-step',
                        name: 'Smooth Step',
                        data: {
                          wireType: 'smooth-step',
                        },
                      },
                      {
                        id: 'change-wire-type:straight',
                        name: 'Straight',
                        data: {
                          wireType: 'straight',
                        },
                      },
                    ],
                  },
                ],
              },
              {
                id: 'delete-wire',
                name: 'Delete wire',
              },
              {
                id: 'add-if-node',
                name: 'Add If node',
              },
            ],
          },
        ],
      },
      blankSpace: {
        contextType: typeOf<Record<string, never>>(),
        group: [
          {
            metadata: {
              label: 'node',
            },
            items: [
              {
                id: 'add-node',
                name: 'Add node',
                contexts: [
                  {
                    metadata: {
                      label: 'node-type',
                    },
                    items: avaliableNodes,
                  },
                ],
              },
              {
                id: 'paste-node',
                name: 'Paste node',
                tip: useHotKeyDisplay([HOTKEY.CTRL, 'V']),
              },
              {
                id: 'select-all-node',
                name: 'Select all nodes',
                tip: useHotKeyDisplay([HOTKEY.CTRL, 'A']),
              },
            ],
          },
          {
            metadata: {
              label: 'comment',
            },
            items: [
              {
                id: 'group-node',
                name: 'Group with comment',
                tip: useHotKeyDisplay([HOTKEY.CTRL, 'G']),
              },
              {
                id: 'add-group',
                name: 'Add comment',
              },
            ],
          },
          {
            metadata: {
              label: 'relocate',
            },
            items: [
              {
                id: 'move-to-node',
                name: 'Move to node',
              },
            ],
          },
          {
            metadata: {
              label: 'export',
            },
            items: [
              {
                id: 'export-workflow',
                name: 'Export workflow image',
              },
            ],
          },
        ],
      },
    }),
    [],
  );

  return contexts;
}

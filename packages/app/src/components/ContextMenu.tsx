/** @jsxImportSource @emotion/react */
import React, { ForwardedRef, forwardRef, useEffect, useState } from 'react';

import { DN100, DN0, N0 } from '@atlaskit/theme/colors';
import { token } from '@atlaskit/tokens';
import { css } from '@emotion/react';
import {
  useMergeRefs,
  autoUpdate,
  shift,
  useFloating,
} from '@floating-ui/react';
import clsx from 'clsx';

import { ContextMenuItem } from './ContextMenuItem';
import { useContextMenuConfig } from '../hooks/useContextMenuConfig';
import {
  type ContextMenuConfigContextItem,
  type ContextMenuProps,
} from '../state/contextMenu';
import { hexToRgba } from '../utils/colorConverter';

const styles = css`
  position: absolute;
  &.disabled {
    display: none;
  }
`;

const contextMenuStyles = css`
  min-width: 150px;
  max-width: 250px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
  border: 1px solid ${token('color.text')};
  border-radius: 5px;
  padding: 8px 0;
  color: ${token('color.text')};
  background-color: ${token('elevation.surface.overlay')};
  box-shadow: 0 8px 16px ${hexToRgba(DN0, 0.25)};
  z-index: 1000;
  user-select: none;

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
`;

export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  function MyContextMenu(
    props: ContextMenuProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const { x, y, context, disabled } = props;
    const [selectedItemIndex, setSelectedItemIndex] = useState(-1);

    const { refs, floatingStyles, update } = useFloating({
      placement: 'bottom-start',
      whileElementsMounted: autoUpdate,
      middleware: [shift({ crossAxis: true })],
    });

    const mergedRef = useMergeRefs([ref, refs.setReference]);

    const { contexts, commands } = useContextMenuConfig();
    const { items } = contexts[context['type']];

    useEffect(() => {
      update();
    }, [update, x, y]);

    const showItems: ContextMenuConfigContextItem[] = items;

    return (
      <div
        ref={mergedRef}
        css={styles}
        style={{ top: y + 4, left: x - 16 }}
        className={clsx({ disabled })}
        onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
          event.stopPropagation()
        }
      >
        <div
          css={contextMenuStyles}
          style={floatingStyles}
          ref={refs.setFloating}
        >
          <div className="context-menu-item-list">
            {showItems.map(
              (item: ContextMenuConfigContextItem, index: number) => (
                <ContextMenuItem
                  key={item.id}
                  config={item}
                  context={context.items}
                  active={index === selectedItemIndex}
                />
              ),
            )}
          </div>
        </div>
      </div>
    );
  },
);

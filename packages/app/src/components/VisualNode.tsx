/** @jsxImportSource @emotion/react */
import React, {
  CSSProperties,
  FC,
  ForwardedRef,
  forwardRef,
  memo,
  useMemo,
} from 'react';

import { css } from '@emotion/react';

import { useStableCallback } from '../hooks/useStableCallback';
import {
  MinimizedVisualNodeContentProps,
  VisualNodeContentProps,
  VisualNodeProps,
} from '../types/node.type';

const visualNodeStyles = css`
  color: var(--text-color);
  background: var(--node-background-color);
  border-radius: 7px;
  display: flex;
  flex-direction: column;
`;

/* eslint-disable react/prop-types */
export const VisualNode = memo(
  forwardRef<HTMLDivElement, VisualNodeProps>(function MyVisualNode(
    {
      node,
      connections = [],
      xDelta = 0,
      yDelta = 0,
      attributes,
      attributeListeners,
      isDragging,
      isMinimized,
      scale,
      onNodeSizeChange,
      onNodeSelect,
      onNodeMouseOver,
      onNodeMouseOut,
    }: VisualNodeProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const style = useMemo(() => {
      const styling: CSSProperties = {
        opacity: isDragging ? '0' : '',
        transform: `translate(${node.visualInfo.position.x + xDelta}px, ${
          node.visualInfo.position.y + yDelta
        }px) scale(${scale ?? 1})`,
        zIndex: node.visualInfo.position.zIndex,
        width: node.visualInfo.size.width,
        height: node.visualInfo.size.height,
        border: '2px solid var(--primary-color)',
      };

      return styling;
    }, [
      node.visualInfo.position.x,
      node.visualInfo.position.y,
      xDelta,
      yDelta,
      node.visualInfo.size.width,
      node.visualInfo.size.height,
      node.visualInfo.position.zIndex,
      node.state,
      isDragging,
      scale,
    ]);

    // abstract away the difference between function and object refs.
    const nodeRef = (instance: HTMLDivElement | null) => {
      if (typeof ref === 'function') {
        // refs are created by a callback function.
        ref(instance);
      } else if (ref) {
        // refs are created by `React.createRef()`.
        ref.current = instance;
      }
    };

    const onNodeGrabClick = useStableCallback((event: React.MouseEvent) => {
      event.stopPropagation();
      onNodeSelect?.();

      console.log('onNodeGrabClick');
    });

    return (
      <div
        ref={nodeRef}
        css={visualNodeStyles}
        style={style}
        {...attributes}
        onMouseOver={(event) => onNodeMouseOver?.(event, node.id)}
        onMouseOut={(event) => onNodeMouseOut?.(event, node.id)}
      >
        {isMinimized ? (
          <MinimizedVisualNodeContent
            node={node}
            connections={connections}
            attributeListeners={attributeListeners}
            onNodeGrabClick={onNodeGrabClick}
          />
        ) : (
          <VisualNodeContent
            node={node}
            connections={connections}
            attributeListeners={attributeListeners}
            onNodeGrabClick={onNodeGrabClick}
          />
        )}
      </div>
    );
  }),
);

/* eslint-disable react/prop-types */
const MinimizedVisualNodeContent: FC<MinimizedVisualNodeContentProps> = memo(
  ({
    node,
    connections = [],
    attributeListeners,
    onNodeGrabClick,
  }: MinimizedVisualNodeContentProps) => {
    // TODO: Add Input and Output circles
    return (
      <>
        <div {...attributeListeners} onClick={onNodeGrabClick}></div>
      </>
    );
  },
);

MinimizedVisualNodeContent.displayName = 'MinimizedVisualNodeContent';

/* eslint-disable react/prop-types */
const VisualNodeContent: FC<VisualNodeContentProps> = memo(
  ({
    node,
    connections = [],
    attributeListeners,
    onNodeGrabClick,
  }: VisualNodeContentProps) => {
    // TODO: Add Input and Output circles
    return (
      <>
        <div {...attributeListeners} onClick={onNodeGrabClick}></div>
      </>
    );
  },
);

VisualNodeContent.displayName = 'VisualNodeContent';

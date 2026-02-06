import React from 'react';
import {
  DndContext,
  closestCorners,
  MeasuringStrategy,
  PointerSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import SortableItem from './SortableItem'; // make sure you have this
import { Button } from '@/components/ui/button'; // adjust import path
import { IconCheck, IconRotateDot } from '@tabler/icons-react';

// helper: wide fields
const isWideField = (field) =>
  field?.width === '100%' ||
  ['heroSlide', 'group', 'review'].includes(field?.key);

export default function ConfigGrid({
  layout,
  schema,
  setLayout,
  saveLayout,
  resetLayout,
  mode,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        setLayout((items) => {
          const oldIndex = items.indexOf(active.id);
          const newIndex = items.indexOf(over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }}>
      <SortableContext items={layout} strategy={rectSortingStrategy}>
        <div className='w-full grid grid-cols-2 auto-rows-max gap-4 px-3'>
          {layout.map((id) => {
            const field = schema.find((f) => f.key === id);
            if (!field) return null;

            const fieldClass = isWideField(field) ? 'col-span-2' : 'col-span-1';

            return (
              <SortableItem className={`p-0 ${fieldClass}`} key={id} id={id}>
                <div className='flex items-center justify-between p-3 rounded-xl shadow-sm cursor-move bg-white dark:bg-gray-800 border border-gray-900 dark:border-gray-700 hover:shadow-md transition-all duration-200'>
                  <span className='text-sm font-medium text-gray-800 dark:text-gray-200'>
                    {field.label || field.key}
                  </span>
                  <span className='text-gray-400 dark:text-gray-500 text-xs'>
                    {field.type}
                  </span>
                </div>
              </SortableItem>
            );
          })}
        </div>
      </SortableContext>

      <div className='w-full max-w-[15rem] h-full p-4'>
        {mode === 'config' && (
          <>
            <Button
              type='button'
              size='sm'
              onClick={saveLayout}
              className='flex items-center gap-1 w-full mb-2 p-5'>
              <IconCheck className='h-4 w-4' />
              Done
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={resetLayout}
              className='flex p-5 w-full items-center gap-1'>
              <IconRotateDot className='h-4 w-4' />
              Reset
            </Button>
          </>
        )}
      </div>
    </DndContext>
  );
}

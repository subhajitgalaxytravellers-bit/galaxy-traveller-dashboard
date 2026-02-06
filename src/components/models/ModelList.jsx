import { AlertCircle } from 'lucide-react';

export default function ModelList({
  models = [],
  isLoading = false,
  isError = false,
  errorMessage = '',
  selectedKey = null,
  onSelect = () => {},
}) {
  return (
    <section className='min-w-0'>
      <div className='mb-3 flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Models</h1>
      </div>

      {isLoading && <div className='text-sm'>Loading models…</div>}

      {isError && (
        <div className='text-sm rounded-md border p-3 flex items-start gap-2'>
          <AlertCircle className='h-4 w-4 mt-0.5 text-red-600' />
          <div>{errorMessage || 'Failed to load /api/schema'}</div>
        </div>
      )}

      {models?.length > 0 && (
        <div className='rounded-md border overflow-hidden'>
          <table className='min-w-[640px] w-full text-sm'>
            <thead className='bg-zinc-50 dark:bg-zinc-800'>
              <tr>
                <th className='px-3 py-2 text-left'>Key</th>
                <th className='px-3 py-2 text-left'>Name</th>
                <th className='px-3 py-2 text-left'>Type</th>
                <th className='px-3 py-2 text-left'>Created</th>
              </tr>
            </thead>
            <tbody>
              {models.map((d) => (
                <tr
                  key={d.key}
                  className={`border-t align-top cursor-pointer ${
                    selectedKey === d.key
                      ? 'bg-zinc-50/70 dark:bg-zinc-800/50'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                  onClick={() => onSelect(d.key)}>
                  <td className='px-3 py-2 font-medium'>{d.key}</td>
                  <td className='px-3 py-2'>{d.name}</td>
                  <td className='px-3 py-2'>
                    <span className='inline-flex text-xs px-2 py-0.5 rounded-full border'>
                      {d.type}
                    </span>
                  </td>
                  <td className='px-3 py-2'>
                    <span className='text-xs opacity-70'>
                      {d.createdAt
                        ? new Date(d.createdAt).toLocaleString()
                        : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!models?.length && !isLoading && !isError && (
        <div className='text-sm opacity-70'>No models yet.</div>
      )}
    </section>
  );
}

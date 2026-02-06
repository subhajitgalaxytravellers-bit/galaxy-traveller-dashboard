// components/AccessDenied.jsx
export default function AccessDenied({ title = 'Access Denied', message }) {
  return (
    <div className='p-8'>
      <h1 className='text-xl font-semibold mb-2'>{title}</h1>
      <p className='text-sm text-muted-foreground'>
        {message || 'You don’t have permission to view this page.'}
      </p>
    </div>
  );
}

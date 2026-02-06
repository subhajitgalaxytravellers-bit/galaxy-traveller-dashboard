'use client';

import { useEffect, useState } from 'react';
import RichTextField from '@/components/fields/RichTextField';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { Header } from '@/components/Header';
import SavePublishActions from '@/components/SavePublishActions';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'react-toastify';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState('');
  const [terms, setTerms] = useState('');
  const [loading, setLoading] = useState(true);
  const { can } = usePermissions();
  const canRead = can('policy', 'read');
  const canUpdate = can('policy', 'publish');

  useEffect(() => {
    if (!canRead) return;
    async function fetchPolicy() {
      try {
        const res = await api().get('/api/policy/moderation');
        setPolicies(res.data?.policies || '');
        setTerms(res.data?.terms || '');
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchPolicy();
  }, [canRead]);

  const handleSave = async () => {
    const payload = { policies, terms };
    await api().put('/api/policy/moderation', payload);
    toast.success('Terms & Policies updated');
  };

  if (!canRead)
    return (
      <div className='p-6 text-muted-foreground'>
        You do not have permission to view policies.
      </div>
    );
  if (loading) return <div className='p-6'>Loading...</div>;

  return (
    <div className='h-screen flex flex-col'>
      <Header
        title='Policies'
        right={canUpdate && <Button onClick={handleSave}>Publish</Button>}
      />

      {/* Scrollable main content */}
      <div className='flex-1 flex flex-col gap-4  overflow-y-auto custom-y-scroll px-6 my-10 '>
        <div>
          <h2 className='text-xl font-semibold mb-2'>Policies</h2>
          <RichTextField value={policies} onChange={setPolicies} />
        </div>

        <div>
          <h2 className='text-xl font-semibold mb-2'>Terms & Conditions</h2>
          <RichTextField value={terms} onChange={setTerms} />
        </div>
      </div>
    </div>
  );
}

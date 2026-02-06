import { Header } from '@/components/Header';
import RolePanel from '@/components/roles/RolePanel';
import { useRoles } from '@/hooks/use-role';

export default function RoleSettings() {
  const { data: roles, isLoading, isError, error } = useRoles();

  return (
    <div className='w-full h-screen flex flex-col'>
      <Header title='Roles & Permissions' />
      <div className='p-4 '>
        <RolePanel
          roles={roles}
          isLoading={isLoading}
          isError={isError}
          error={error}
        />
      </div>
    </div>
  );
}

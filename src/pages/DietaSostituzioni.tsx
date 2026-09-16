import { Sostituzioni } from '../components/Sostituzioni';
import { NAV_DIETA, SottoNav } from '../components/SottoNav';

export default function DietaSostituzioni() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dieta</h1>
      <SottoNav voci={NAV_DIETA} />
      <Sostituzioni />
    </div>
  );
}

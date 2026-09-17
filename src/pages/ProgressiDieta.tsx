import { Aderenza } from '../components/Aderenza';
import { TdeeReale } from '../components/TdeeReale';
import { NAV_PROGRESSI, SottoNav } from '../components/SottoNav';

export default function ProgressiDieta() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Progressi</h1>
      <SottoNav voci={NAV_PROGRESSI} />
      <Aderenza />
      <TdeeReale />
    </div>
  );
}

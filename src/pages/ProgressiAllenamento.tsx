import { Deload } from '../components/Deload';
import { GraficoVolume } from '../components/GraficoVolume';
import { VolumeMuscolare } from '../components/VolumeMuscolare';
import { NAV_PROGRESSI, SottoNav } from '../components/SottoNav';

export default function ProgressiAllenamento() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Progressi</h1>
      <SottoNav voci={NAV_PROGRESSI} />
      <Deload />
      <VolumeMuscolare />
      <GraficoVolume />
    </div>
  );
}

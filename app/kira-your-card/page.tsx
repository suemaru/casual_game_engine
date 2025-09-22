import styles from './page.module.css';
import { BusinessCardEditor } from '../features/kira-your-card/components/BusinessCardEditor';

export const metadata = {
  title: 'KiraYourCard Builder',
  description: 'Create and preview holographic business cards in the browser.',
};

export default function KiraYourCardPage() {
  return (
    <main className={styles.main}>
      <div className={styles.wrapper}>
        <BusinessCardEditor />
      </div>
    </main>
  );
}

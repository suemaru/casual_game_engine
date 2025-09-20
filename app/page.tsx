import styles from './page.module.css';
import { CardShowcase } from './components/card/CardShowcase';
import { cardSpec } from './data/cardSpec';

export default function Page() {
  return (
    <main className={styles.main}>
      <CardShowcase spec={cardSpec} />
    </main>
  );
}

import styles from '../page.module.css';
import { CardShowcase } from '../components/card/CardShowcase';
import { cardSpec } from '../data/cardSpec';

export const metadata = {
  title: 'Card Showcase',
};

export default function ShowcasePage() {
  return (
    <main className={styles.main}>
      <CardShowcase spec={cardSpec} />
    </main>
  );
}

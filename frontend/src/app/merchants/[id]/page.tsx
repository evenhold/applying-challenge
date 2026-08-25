import MerchantDetail from './MerchantDetail';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function Page() {
  return <MerchantDetail />;
}

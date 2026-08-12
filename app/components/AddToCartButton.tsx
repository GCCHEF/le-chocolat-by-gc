import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            aria-busy={fetcher.state !== 'idle'}
            type="submit"
            onClick={onClick}
            disabled={Boolean(disabled) || fetcher.state !== 'idle'}
          >
            <span aria-live="polite">
              {fetcher.state === 'idle' ? children : 'Adding…'}
            </span>
          </button>
        </>
      )}
    </CartForm>
  );
}

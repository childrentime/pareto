'use client'

import { Link, useLoaderData } from '@paretojs/core'
import { defineContextStore } from '@paretojs/core/store'
import type { LoaderContext } from '@paretojs/core'

interface Product {
  id: number
  name: string
  price: number
  stock: number
}

interface CartItem {
  product: Product
  qty: number
}

interface LoaderData {
  products: Product[]
  promoCode: string
  discount: number
}

interface CartState {
  products: Product[]
  promoCode: string
  discount: number
  cart: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: number) => void
  updateQty: (productId: number, qty: number) => void
}

const {
  Provider: CartProvider,
  useStore: useCartStore,
} = defineContextStore<CartState, LoaderData>((loaderData) => (set) => ({
  products: loaderData.products,
  promoCode: loaderData.promoCode,
  discount: loaderData.discount,
  cart: [],
  addToCart: (product) =>
    set((draft) => {
      const existing = draft.cart.find((i) => i.product.id === product.id)
      if (existing) {
        existing.qty++
      } else {
        draft.cart.push({ product, qty: 1 })
      }
    }),
  removeFromCart: (productId) =>
    set((draft) => {
      draft.cart = draft.cart.filter((i) => i.product.id !== productId)
    }),
  updateQty: (productId, qty) =>
    set((draft) => {
      const item = draft.cart.find((i) => i.product.id === productId)
      if (item) {
        item.qty = Math.max(0, qty)
        if (item.qty === 0) {
          draft.cart = draft.cart.filter((i) => i.product.id !== productId)
        }
      }
    }),
}))

export function loader(_ctx: LoaderContext) {
  return {
    products: [
      { id: 1, name: 'Mechanical Keyboard', price: 149, stock: 12 },
      { id: 2, name: 'Wireless Mouse', price: 79, stock: 34 },
      { id: 3, name: 'USB-C Hub', price: 59, stock: 8 },
      { id: 4, name: '4K Monitor', price: 499, stock: 5 },
      { id: 5, name: 'Webcam HD', price: 89, stock: 21 },
    ],
    promoCode: 'PARETO20',
    discount: 0.2,
  } satisfies LoaderData
}

export default function SSRStorePage() {
  const data = useLoaderData<LoaderData>()

  return (
    <CartProvider initialData={data}>
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-14 lg:py-20">
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors mb-6"
          >
            <svg
              className="w-4 h-4 mr-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-4">
            SSR + Store
          </h1>
          <p className="text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
            Server-loaded data initializes a reactive store via{' '}
            <code className="text-[0.8125rem] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-orange-700 dark:text-orange-400">
              defineContextStore
            </code>
            . The product catalog is fetched on the server and hydrated into a
            store that also manages client-side cart state.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr,320px] gap-8 items-start">
          <ProductList />
          <CartSummary />
        </div>

        <div className="h-px bg-stone-200 dark:bg-stone-800 my-10 transition-colors duration-300" />

        <SourceCode />
      </div>
    </CartProvider>
  )
}

function ProductList() {
  const { products, cart, addToCart } = useCartStore()

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-5">
        Products
        <span className="ml-2 text-[0.6875rem] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium">
          SSR
        </span>
      </h2>
      <div className="space-y-2">
        {products.map((product) => {
          const inCart = cart.find((i) => i.product.id === product.id)
          return (
            <div
              key={product.id}
              className="flex items-center justify-between py-3 px-4 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 transition-colors duration-300"
            >
              <div>
                <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                  {product.name}
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-sm font-semibold tabular-nums text-stone-900 dark:text-stone-50">
                    ${product.price}
                  </span>
                  <span className="text-[0.6875rem] text-stone-400 dark:text-stone-500">
                    {product.stock} in stock
                  </span>
                </div>
              </div>
              <button
                onClick={() => addToCart(product)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                  inCart
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                    : 'bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-300'
                }`}
              >
                {inCart ? `In cart (${inCart.qty})` : 'Add to cart'}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function CartSummary() {
  const { cart, promoCode, discount, updateQty, removeFromCart } =
    useCartStore()

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0)
  const discountAmount = subtotal * discount
  const total = subtotal - discountAmount

  return (
    <section className="lg:sticky lg:top-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-5">
        Cart
        <span className="ml-2 text-[0.6875rem] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-medium">
          client
        </span>
      </h2>
      <div className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 transition-colors duration-300">
        {cart.length === 0 ? (
          <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-6">
            Cart is empty
          </p>
        ) : (
          <>
            <div className="space-y-3 mb-5">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-stone-700 dark:text-stone-200 truncate block">
                      {item.product.name}
                    </span>
                    <span className="text-xs tabular-nums text-stone-400 dark:text-stone-500">
                      ${item.product.price} each
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.product.id, item.qty - 1)}
                      className="w-6 h-6 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-xs flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-sm tabular-nums w-5 text-center text-stone-700 dark:text-stone-200">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.product.id, item.qty + 1)}
                      className="w-6 h-6 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-xs flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="h-px bg-stone-200 dark:bg-stone-800 mb-4" />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-stone-500 dark:text-stone-400">
                <span>Subtotal</span>
                <span className="tabular-nums">${subtotal}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>
                  Promo{' '}
                  <span className="font-mono text-[0.6875rem]">
                    {promoCode}
                  </span>
                </span>
                <span className="tabular-nums">
                  -${discountAmount.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-stone-900 dark:text-stone-50 pt-1.5">
                <span>Total</span>
                <span className="tabular-nums">${total.toFixed(0)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function SourceCode() {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-5">
        Source
      </h2>
      <div className="rounded-xl bg-stone-900 dark:bg-stone-900/80 border border-stone-800 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-800">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
          </div>
          <span className="text-xs text-stone-500 ml-2">
            app/ssr-store/page.tsx
          </span>
        </div>
        <pre className="p-5 text-[0.8125rem] leading-relaxed overflow-x-auto">
          <code className="text-stone-300">
            <span className="text-stone-500">
              {'// 1. Define a context store that accepts loader data\n'}
            </span>
            {'const { Provider, useStore } =\n'}
            {'  '}
            <span className="text-orange-400">defineContextStore</span>
            {'<State, LoaderData>(\n'}
            {'    (loaderData) => (set) => ({\n'}
            {'      products: loaderData.products,  '}
            <span className="text-stone-500">{'// from SSR'}</span>
            {'\n'}
            {'      cart: [],                       '}
            <span className="text-stone-500">{'// client state'}</span>
            {'\n'}
            {'      addToCart: (p) => set(draft => {\n'}
            {'        draft.cart.push({ product: p, qty: 1 })\n'}
            {'      }),\n'}
            {'    })\n'}
            {'  )\n\n'}
            <span className="text-stone-500">
              {'// 2. Loader runs on server\n'}
            </span>
            {'export function '}
            <span className="text-orange-400">loader</span>
            {'() {\n'}
            {'  return { products: db.getProducts() }\n'}
            {'}\n\n'}
            <span className="text-stone-500">
              {'// 3. Pass loader data to Provider\n'}
            </span>
            {'export default function Page() {\n'}
            {'  const data = '}
            <span className="text-orange-400">useLoaderData</span>
            {'()\n'}
            {'  return (\n'}
            {'    <'}
            <span className="text-orange-400">Provider</span>
            {' initialData={data}>\n'}
            {'      <ProductList />\n'}
            {'    </Provider>\n'}
            {'  )\n'}
            {'}'}
          </code>
        </pre>
      </div>
    </section>
  )
}

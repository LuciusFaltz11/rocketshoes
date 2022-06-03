import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`);
      const stock: Stock = response.data;

      if (stock.amount === 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex >= 0) {
        const newAmount = cart[productIndex].amount + 1;

        if (stock.amount < newAmount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const newCart = cart;
        newCart[productIndex].amount += 1;

        setCart([...newCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        const responseProductApi = await api.get(`/products/${productId}`);
        const newProduct: Product = responseProductApi.data;

        if (newProduct.id === productId) {
          newProduct.amount = 1;

          const newCart = [...cart, newProduct];
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        }
      }
      toast.success('Produto adicionado ao carrinho');
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex < 0) {
        toast.error('Erro na remoção do produto');
        return;
      }
      const newCart = cart.filter((product) => product.id !== productId);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const response = await api.get(`/stock/${productId}`);
      const productStock: Stock = response.data;

      if (productStock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const index = cart.findIndex((product) => product.id === productId);

      cart[index].amount = amount;

      const newCart = [...cart];

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

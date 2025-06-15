# Chapter 6: The Testing-First Philosophy

> "A test is worth a thousand console.logs."

## The Paradigm Shift

Let me tell you about the day our team's entire testing philosophy changed. We had just deployed a "simple" update to our checkout component—a minor prop rename that TypeScript said was safe. Six hours later, we discovered that our integration tests hadn't caught a critical edge case: users with saved payment methods couldn't complete purchases.

The fix took five minutes. The post-mortem took five hours. The lesson? In autonomous development, tests aren't just safety nets—they're the specification that teaches AI how your application should behave.

## Why Testing-First for AI Development?

When humans write code, they carry implicit knowledge:
- "This function should handle null values"
- "This component needs to be accessible"
- "This state update could cause a race condition"

AI doesn't have this implicit knowledge. It learns from patterns, and the clearest patterns come from tests. A comprehensive test suite becomes the contract that autonomous agents must fulfill.

Consider this transformation:
```typescript
// Without tests, AI might write:
const calculateDiscount = (price: number, percentage: number) => {
  return price * (percentage / 100);
};

// With comprehensive tests, AI writes:
const calculateDiscount = (price: number, percentage: number): number => {
  if (price < 0) {
    throw new Error('Price cannot be negative');
  }
  if (percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }
  // Handle floating point precision
  return Math.round((price * (percentage / 100)) * 100) / 100;
};
```

## The React Testing Pyramid for AI

Traditional testing pyramids don't work for autonomous development. Here's our adapted model:

```
        ╱─────────────╲
       ╱   E2E Tests   ╲    ← User journeys (10%)
      ╱─────────────────╲
     ╱ Integration Tests ╲   ← Component interactions (30%)
    ╱─────────────────────╲
   ╱   Component Tests     ╲  ← Component behavior (40%)
  ╱─────────────────────────╲
 ╱    Utility Tests          ╲ ← Pure functions (20%)
╱─────────────────────────────╲
```

## Setting Up React Testing Library

First, let's configure React Testing Library for maximum effectiveness:

### Custom Render Function

Create `src/test-utils/index.tsx`:

```typescript
import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { theme } from '@/styles/theme';

interface TestProviderProps {
  children: ReactNode;
  initialRoute?: string;
}

const TestProviders = ({ children, initialRoute = '/' }: TestProviderProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[initialRoute]}>
          {children}
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const user = userEvent.setup();
  
  const rendered = render(ui, {
    wrapper: ({ children }) => (
      <TestProviders initialRoute={options?.initialRoute}>
        {children}
      </TestProviders>
    ),
    ...options,
  });

  return {
    ...rendered,
    user,
  };
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Custom queries
export const getByTextContent = (
  container: HTMLElement,
  text: string
): HTMLElement | null => {
  const elements = container.querySelectorAll('*');
  return Array.from(elements).find(element =>
    element.textContent?.includes(text)
  ) as HTMLElement | null;
};
```

## Component Testing Patterns

### Pattern 1: The Comprehensive Component Test

Let's test a real-world component—a `ProductCard` that displays product information:

```typescript
// src/components/ProductCard/ProductCard.tsx
import { useState } from 'react';
import { formatCurrency } from '@/utils/format';
import { Product } from '@/types/product';
import * as S from './ProductCard.styles';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onToggleFavorite?: (productId: string) => void;
  isFavorite?: boolean;
  maxQuantity?: number;
  testId?: string;
}

export const ProductCard = ({
  product,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  maxQuantity = 10,
  testId = 'product-card',
}: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await onAddToCart(product, quantity);
      setQuantity(1); // Reset after successful add
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= maxQuantity) {
      setQuantity(value);
    }
  };

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <S.Card data-testid={testId}>
      <S.ImageContainer>
        <S.ProductImage 
          src={product.image} 
          alt={product.name}
          loading="lazy"
        />
        {product.discount && (
          <S.DiscountBadge>
            -{product.discount}%
          </S.DiscountBadge>
        )}
        {onToggleFavorite && (
          <S.FavoriteButton
            onClick={() => onToggleFavorite(product.id)}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            data-testid={`${testId}-favorite`}
          >
            {isFavorite ? '❤️' : '🤍'}
          </S.FavoriteButton>
        )}
      </S.ImageContainer>

      <S.Content>
        <S.Title>{product.name}</S.Title>
        <S.Description>{product.description}</S.Description>
        
        <S.PriceContainer>
          <S.Price>
            {formatCurrency(product.price)}
          </S.Price>
          {product.originalPrice && (
            <S.OriginalPrice>
              {formatCurrency(product.originalPrice)}
            </S.OriginalPrice>
          )}
        </S.PriceContainer>

        <S.StockStatus>
          {isOutOfStock && (
            <S.OutOfStock>Out of stock</S.OutOfStock>
          )}
          {isLowStock && (
            <S.LowStock>Only {product.stock} left!</S.LowStock>
          )}
        </S.StockStatus>

        <S.Actions>
          <S.QuantitySelector>
            <S.QuantityButton
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              -
            </S.QuantityButton>
            <S.QuantityInput
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(Number(e.target.value))}
              min={1}
              max={maxQuantity}
              aria-label="Product quantity"
            />
            <S.QuantityButton
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= maxQuantity}
              aria-label="Increase quantity"
            >
              +
            </S.QuantityButton>
          </S.QuantitySelector>

          <S.AddToCartButton
            onClick={handleAddToCart}
            disabled={isOutOfStock || isLoading}
            data-testid={`${testId}-add-to-cart`}
          >
            {isLoading ? 'Adding...' : 'Add to Cart'}
          </S.AddToCartButton>
        </S.Actions>
      </S.Content>
    </S.Card>
  );
};
```

Now, the comprehensive test suite:

```typescript
// src/components/ProductCard/ProductCard.test.tsx
import { render, screen, waitFor } from '@/test-utils';
import { ProductCard } from './ProductCard';
import { Product } from '@/types/product';
import { axe } from 'jest-axe';

const mockProduct: Product = {
  id: '1',
  name: 'Premium Headphones',
  description: 'High-quality wireless headphones',
  price: 199.99,
  originalPrice: 299.99,
  image: '/images/headphones.jpg',
  stock: 10,
  discount: 33,
};

describe('ProductCard', () => {
  const mockAddToCart = jest.fn();
  const mockToggleFavorite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders product information correctly', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.description)).toBeInTheDocument();
      expect(screen.getByText('$199.99')).toBeInTheDocument();
      expect(screen.getByText('$299.99')).toBeInTheDocument();
      expect(screen.getByText('-33%')).toBeInTheDocument();
    });

    it('renders out of stock state', () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 };
      render(
        <ProductCard 
          product={outOfStockProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      expect(screen.getByText('Out of stock')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-add-to-cart')).toBeDisabled();
    });

    it('renders low stock warning', () => {
      const lowStockProduct = { ...mockProduct, stock: 3 };
      render(
        <ProductCard 
          product={lowStockProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      expect(screen.getByText('Only 3 left!')).toBeInTheDocument();
    });

    it('renders favorite button when handler provided', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
          onToggleFavorite={mockToggleFavorite}
          isFavorite={false}
        />
      );

      expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles quantity changes correctly', async () => {
      const { user } = render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      const increaseButton = screen.getByLabelText('Increase quantity');
      const decreaseButton = screen.getByLabelText('Decrease quantity');
      const quantityInput = screen.getByLabelText('Product quantity');

      // Increase quantity
      await user.click(increaseButton);
      expect(quantityInput).toHaveValue(2);

      // Decrease quantity
      await user.click(decreaseButton);
      expect(quantityInput).toHaveValue(1);

      // Shouldn't go below 1
      await user.click(decreaseButton);
      expect(quantityInput).toHaveValue(1);
      expect(decreaseButton).toBeDisabled();
    });

    it('handles direct quantity input', async () => {
      const { user } = render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
          maxQuantity={5}
        />
      );

      const quantityInput = screen.getByLabelText('Product quantity');

      await user.clear(quantityInput);
      await user.type(quantityInput, '3');
      expect(quantityInput).toHaveValue(3);

      // Should not exceed max
      await user.clear(quantityInput);
      await user.type(quantityInput, '10');
      expect(quantityInput).toHaveValue(5);
    });

    it('adds product to cart with correct quantity', async () => {
      const { user } = render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      const increaseButton = screen.getByLabelText('Increase quantity');
      const addToCartButton = screen.getByTestId('product-card-add-to-cart');

      // Set quantity to 3
      await user.click(increaseButton);
      await user.click(increaseButton);

      // Add to cart
      await user.click(addToCartButton);

      expect(mockAddToCart).toHaveBeenCalledWith(mockProduct, 3);
    });

    it('shows loading state during add to cart', async () => {
      mockAddToCart.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const { user } = render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      const addToCartButton = screen.getByTestId('product-card-add-to-cart');
      
      await user.click(addToCartButton);
      expect(addToCartButton).toHaveTextContent('Adding...');
      expect(addToCartButton).toBeDisabled();

      await waitFor(() => {
        expect(addToCartButton).toHaveTextContent('Add to Cart');
        expect(addToCartButton).not.toBeDisabled();
      });
    });

    it('resets quantity after successful add to cart', async () => {
      const { user } = render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      const increaseButton = screen.getByLabelText('Increase quantity');
      const quantityInput = screen.getByLabelText('Product quantity');
      const addToCartButton = screen.getByTestId('product-card-add-to-cart');

      await user.click(increaseButton);
      await user.click(increaseButton);
      expect(quantityInput).toHaveValue(3);

      await user.click(addToCartButton);

      await waitFor(() => {
        expect(quantityInput).toHaveValue(1);
      });
    });

    it('toggles favorite status', async () => {
      const { user } = render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
          onToggleFavorite={mockToggleFavorite}
          isFavorite={false}
        />
      );

      const favoriteButton = screen.getByTestId('product-card-favorite');
      
      await user.click(favoriteButton);
      expect(mockToggleFavorite).toHaveBeenCalledWith(mockProduct.id);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
          onToggleFavorite={mockToggleFavorite}
          isFavorite={true}
        />
      );

      expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument();
      expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument();
      expect(screen.getByLabelText('Decrease quantity')).toBeInTheDocument();
      expect(screen.getByLabelText('Product quantity')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const { user } = render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      await user.tab();
      expect(screen.getByLabelText('Decrease quantity')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Product quantity')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Increase quantity')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('product-card-add-to-cart')).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional props gracefully', () => {
      const minimalProduct: Product = {
        id: '1',
        name: 'Simple Product',
        description: 'Description',
        price: 9.99,
        image: '/image.jpg',
        stock: 100,
      };

      render(
        <ProductCard 
          product={minimalProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      expect(screen.getByText('Simple Product')).toBeInTheDocument();
      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
      expect(screen.queryByTestId('product-card-favorite')).not.toBeInTheDocument();
    });

    it('handles add to cart errors gracefully', async () => {
      mockAddToCart.mockRejectedValueOnce(new Error('Network error'));

      const { user } = render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      const addToCartButton = screen.getByTestId('product-card-add-to-cart');
      await user.click(addToCartButton);

      await waitFor(() => {
        expect(addToCartButton).toHaveTextContent('Add to Cart');
        expect(addToCartButton).not.toBeDisabled();
      });
    });
  });

  describe('Performance', () => {
    it('uses lazy loading for images', () => {
      render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      const image = screen.getByAltText(mockProduct.name);
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('memoizes expensive calculations', () => {
      const { rerender } = render(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      const spy = jest.spyOn(console, 'log');

      // Re-render with same props
      rerender(
        <ProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
        />
      );

      // Verify no unnecessary re-calculations
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
```

## Testing Hooks

Custom hooks require special testing approaches:

```typescript
// src/hooks/useCart.ts
import { useState, useCallback, useMemo } from 'react';
import { Product } from '@/types/product';

interface CartItem extends Product {
  quantity: number;
}

interface UseCartReturn {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

export const useCart = (initialItems: CartItem[] = []): UseCartReturn => {
  const [items, setItems] = useState<CartItem[]>(initialItems);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems(current => {
      const existingIndex = current.findIndex(item => item.id === product.id);
      
      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      
      return [...current, { ...product, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(current => current.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(current => 
      current.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback((productId: string) => {
    return items.some(item => item.id === productId);
  }, [items]);

  return {
    items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
  };
};
```

Testing the hook:

```typescript
// src/hooks/useCart.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCart } from './useCart';
import { Product } from '@/types/product';

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  price: 10,
  description: 'Test',
  image: '/test.jpg',
  stock: 10,
};

const mockProduct2: Product = {
  id: '2',
  name: 'Test Product 2',
  price: 20,
  description: 'Test 2',
  image: '/test2.jpg',
  stock: 5,
};

describe('useCart', () => {
  it('initializes with empty cart', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it('initializes with provided items', () => {
    const initialItems = [
      { ...mockProduct, quantity: 2 },
      { ...mockProduct2, quantity: 1 },
    ];

    const { result } = renderHook(() => useCart(initialItems));

    expect(result.current.items).toEqual(initialItems);
    expect(result.current.totalItems).toBe(3);
    expect(result.current.totalPrice).toBe(40);
  });

  describe('addItem', () => {
    it('adds new item to cart', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockProduct);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual({ ...mockProduct, quantity: 1 });
      expect(result.current.totalItems).toBe(1);
      expect(result.current.totalPrice).toBe(10);
    });

    it('adds item with custom quantity', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockProduct, 3);
      });

      expect(result.current.items[0].quantity).toBe(3);
      expect(result.current.totalItems).toBe(3);
      expect(result.current.totalPrice).toBe(30);
    });

    it('increases quantity for existing item', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockProduct, 2);
      });

      act(() => {
        result.current.addItem(mockProduct, 3);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(5);
      expect(result.current.totalItems).toBe(5);
    });
  });

  describe('removeItem', () => {
    it('removes item from cart', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockProduct);
        result.current.addItem(mockProduct2);
      });

      act(() => {
        result.current.removeItem(mockProduct.id);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe(mockProduct2.id);
    });

    it('handles removing non-existent item', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockProduct);
      });

      act(() => {
        result.current.removeItem('non-existent');
      });

      expect(result.current.items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('updates item quantity', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockProduct, 2);
      });

      act(() => {
        result.current.updateQuantity(mockProduct.id, 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
      expect(result.current.totalItems).toBe(5);
    });

    it('removes item when quantity is 0', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockProduct);
      });

      act(() => {
        result.current.updateQuantity(mockProduct.id, 0);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('removes item when quantity is negative', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockProduct);
      });

      act(() => {
        result.current.updateQuantity(mockProduct.id, -1);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('removes all items', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockProduct);
        result.current.addItem(mockProduct2);
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });
  });

  describe('isInCart', () => {
    it('returns true for items in cart', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockProduct);
      });

      expect(result.current.isInCart(mockProduct.id)).toBe(true);
    });

    it('returns false for items not in cart', () => {
      const { result } = renderHook(() => useCart());

      expect(result.current.isInCart(mockProduct.id)).toBe(false);
    });
  });

  describe('calculations', () => {
    it('calculates totals correctly with multiple items', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockProduct, 2); // $20
        result.current.addItem(mockProduct2, 3); // $60
      });

      expect(result.current.totalItems).toBe(5);
      expect(result.current.totalPrice).toBe(80);
    });

    it('recalculates when items change', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockProduct, 2);
      });

      expect(result.current.totalPrice).toBe(20);

      act(() => {
        result.current.updateQuantity(mockProduct.id, 5);
      });

      expect(result.current.totalPrice).toBe(50);
    });
  });
});
```

## Integration Testing Patterns

Integration tests verify how components work together:

```typescript
// src/features/ShoppingExperience.test.tsx
import { render, screen, within, waitFor } from '@/test-utils';
import { ShoppingExperience } from './ShoppingExperience';
import { mockProducts } from '@/__mocks__/products';
import { server } from '@/__mocks__/server';
import { rest } from 'msw';

describe('Shopping Experience Integration', () => {
  it('complete shopping flow from browse to checkout', async () => {
    const { user } = render(<ShoppingExperience />);

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();
    });

    // Filter products by category
    const categoryFilter = screen.getByLabelText('Filter by category');
    await user.selectOptions(categoryFilter, 'electronics');

    // Search for specific product
    const searchInput = screen.getByPlaceholderText('Search products...');
    await user.type(searchInput, 'headphones');

    // Add product to cart
    const productCard = screen.getByTestId('product-card-1');
    const addButton = within(productCard).getByText('Add to Cart');
    await user.click(addButton);

    // Verify cart updated
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');

    // Navigate to cart
    await user.click(screen.getByLabelText('View cart'));

    // Update quantity in cart
    const quantityInput = screen.getByLabelText('Product quantity');
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');

    // Apply discount code
    const discountInput = screen.getByPlaceholderText('Enter discount code');
    await user.type(discountInput, 'SAVE20');
    await user.click(screen.getByText('Apply'));

    // Verify discount applied
    await waitFor(() => {
      expect(screen.getByText('Discount: -$40.00')).toBeInTheDocument();
    });

    // Proceed to checkout
    await user.click(screen.getByText('Proceed to Checkout'));

    // Fill shipping information
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Address'), '123 Main St');
    await user.type(screen.getByLabelText('City'), 'New York');
    await user.type(screen.getByLabelText('Zip Code'), '10001');

    // Complete order
    await user.click(screen.getByText('Place Order'));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
      expect(screen.getByTestId('order-number')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API failure
    server.use(
      rest.post('/api/orders', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    const { user } = render(<ShoppingExperience />);

    // ... setup cart with items ...

    await user.click(screen.getByText('Place Order'));

    await waitFor(() => {
      expect(screen.getByText('Failed to place order. Please try again.')).toBeInTheDocument();
    });

    // Verify user can retry
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
```

## Snapshot Testing with Purpose

Snapshots should be intentional, not accidental:

```typescript
// src/components/OrderSummary/OrderSummary.test.tsx
import { render } from '@/test-utils';
import { OrderSummary } from './OrderSummary';

describe('OrderSummary Snapshots', () => {
  it('matches snapshot for standard order', () => {
    const order = {
      items: [
        { id: '1', name: 'Product 1', price: 50, quantity: 2 },
        { id: '2', name: 'Product 2', price: 30, quantity: 1 },
      ],
      subtotal: 130,
      tax: 13,
      shipping: 10,
      discount: 20,
      total: 133,
    };

    const { container } = render(<OrderSummary order={order} />);
    
    // Use inline snapshots for small components
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div class="order-summary">
        <h2>Order Summary</h2>
        <div class="items">
          <div class="item">
            <span>Product 1 (x2)</span>
            <span>$100.00</span>
          </div>
          <div class="item">
            <span>Product 2 (x1)</span>
            <span>$30.00</span>
          </div>
        </div>
        <div class="totals">
          <div class="line">
            <span>Subtotal</span>
            <span>$130.00</span>
          </div>
          <div class="line">
            <span>Tax</span>
            <span>$13.00</span>
          </div>
          <div class="line">
            <span>Shipping</span>
            <span>$10.00</span>
          </div>
          <div class="line discount">
            <span>Discount</span>
            <span>-$20.00</span>
          </div>
          <div class="line total">
            <span>Total</span>
            <span>$133.00</span>
          </div>
        </div>
      </div>
    `);
  });

  // Don't snapshot everything - be selective
  it('does NOT snapshot dynamic content', () => {
    const { container } = render(<OrderSummary order={mockOrder} />);
    
    // Instead of snapshotting timestamps, test behavior
    const timestamp = container.querySelector('.timestamp');
    expect(timestamp).toHaveTextContent(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });
});
```

## Performance Testing

Test component performance to catch regressions:

```typescript
// src/components/ProductList/ProductList.perf.test.tsx
import { render, screen, waitFor } from '@/test-utils';
import { ProductList } from './ProductList';
import { measureRender } from '@/test-utils/performance';

describe('ProductList Performance', () => {
  it('renders large lists efficiently', async () => {
    const products = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i}`,
      name: `Product ${i}`,
      price: Math.random() * 100,
      image: '/placeholder.jpg',
      description: 'Description',
      stock: 10,
    }));

    const { renderTime, reRenderTime } = await measureRender(
      <ProductList products={products} />
    );

    // Initial render should be fast even with many items
    // Note: Performance thresholds are environment-dependent
    // Consider using relative comparisons or CI-specific values
    expect(renderTime).toBeLessThan(100); // ms

    // Re-renders should be even faster
    expect(reRenderTime).toBeLessThan(16); // One frame
  });

  it('uses virtualization for long lists', () => {
    const products = Array.from({ length: 10000 }, (_, i) => ({
      id: `${i}`,
      name: `Product ${i}`,
      price: i,
      image: '/placeholder.jpg',
      description: 'Description',
      stock: 10,
    }));

    render(<ProductList products={products} />);

    // Should only render visible items
    const renderedItems = screen.getAllByTestId(/product-item/);
    expect(renderedItems.length).toBeLessThan(50); // Viewport dependent
  });
});
```

## MSW for API Mocking

Set up Mock Service Worker for consistent API testing:

```typescript
// src/__mocks__/handlers.ts
import { http, HttpResponse, delay } from 'msw';

export const handlers = [
  http.get('/api/products', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    let products = [...mockProducts];

    if (category) {
      products = products.filter(p => p.category === category);
    }

    if (search) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return HttpResponse.json({ products });
  }),

  http.post('/api/cart/add', async ({ request }) => {
    const { productId, quantity } = await request.json();

    // Simulate validation
    if (!productId || quantity < 1) {
      return HttpResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    return HttpResponse.json({ 
      success: true, 
      cartId: 'cart-123',
      itemCount: quantity 
    });
  }),

  http.post('/api/orders', async ({ request }) => {
    const order = await request.json();

    // Simulate processing time
    await delay(500);

    return HttpResponse.json({
      orderId: `order-${Date.now()}`,
      status: 'confirmed',
      estimatedDelivery: '3-5 business days',
    });
  }),
];

// src/__mocks__/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// src/setupTests.ts
import { server } from './__mocks__/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Testing Error Boundaries

Error boundaries need special testing approaches:

```typescript
// src/components/ErrorBoundary/ErrorBoundary.test.tsx
import { render, screen } from '@/test-utils';
import { ErrorBoundary } from './ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('resets error state', async () => {
    const { user, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    await user.click(screen.getByText('Try again'));

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('logs errors to monitoring service', () => {
    const logError = jest.spyOn(console, 'error');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('Error caught by boundary'),
      expect.any(Error),
      expect.any(Object)
    );
  });
});
```

## Testing Async Components

React's concurrent features require special handling:

```typescript
// src/components/AsyncDataLoader/AsyncDataLoader.test.tsx
import { render, screen, waitFor } from '@/test-utils';
import { Suspense } from 'react';
import { AsyncDataLoader } from './AsyncDataLoader';

describe('AsyncDataLoader', () => {
  it('shows loading state initially', () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncDataLoader />
      </Suspense>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows data when loaded', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncDataLoader />
      </Suspense>
    );

    await waitFor(() => {
      expect(screen.getByText('Data loaded!')).toBeInTheDocument();
    });
  });

  it('retries on error with exponential backoff', async () => {
    const mockFetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: 'Success!' });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncDataLoader fetchFn={mockFetch} />
      </Suspense>
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();
  });
});
```

## Custom Testing Commands for Claude

Create commands that help Claude write better tests:

### .claude/commands/write-tests.md

```markdown
Write comprehensive tests for $ARGUMENTS component.

Test Categories Required:
1. **Rendering Tests**
   - Default props
   - All prop variations
   - Conditional rendering
   - Loading states
   - Error states
   - Empty states

2. **Interaction Tests**
   - All user events (click, type, focus, etc.)
   - Form submissions
   - Keyboard navigation
   - Drag and drop (if applicable)

3. **Accessibility Tests**
   - ARIA attributes
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast (if applicable)

4. **Integration Tests**
   - Parent-child communication
   - Context/Redux integration
   - Router integration
   - API interactions

5. **Edge Cases**
   - Null/undefined props
   - Empty arrays/objects
   - Very long text
   - Special characters
   - Concurrent updates

6. **Performance Tests**
   - Re-render optimization
   - Large data sets
   - Memory leaks

Testing Guidelines:
- Use React Testing Library
- Query by accessible roles
- Test behavior, not implementation
- Mock external dependencies
- Include meaningful assertions
- Use userEvent for interactions
- Add comments for complex scenarios

Coverage Requirements:
- Minimum 90% line coverage
- 100% branch coverage for critical paths
- All error boundaries tested

Return "TESTS_WRITTEN: [coverage stats]" when complete.
```

## The Testing Mindset for AI

When Claude Code writes tests, it should think like a QA engineer:

1. **What can break?** - Every prop, every event, every state
2. **What would surprise a user?** - Edge cases and errors
3. **What would frustrate a developer?** - Flaky tests, unclear failures
4. **What would please a maintainer?** - Clear structure, good descriptions

## Measuring Test Quality

Not all tests are created equal. Here's how to measure quality:

```typescript
// src/test-utils/quality-metrics.ts
export const analyzeTestQuality = (testFile: string) => {
  const metrics = {
    hasRenderTests: /it\(['"]renders/i.test(testFile),
    hasInteractionTests: /user\.(click|type|hover)/i.test(testFile),
    hasAccessibilityTests: /toHaveNoViolations|getByRole/i.test(testFile),
    hasErrorTests: /throw|error|catch/i.test(testFile),
    hasAsyncTests: /waitFor|findBy|async/i.test(testFile),
    usesTestingLibrary: /@testing-library/i.test(testFile),
    avoidsBadPatterns: !/container\.querySelector|enzyme/i.test(testFile),
  };

  const score = Object.values(metrics).filter(Boolean).length;
  const maxScore = Object.keys(metrics).length;

  return {
    score: `${score}/${maxScore}`,
    metrics,
    grade: score / maxScore >= 0.8 ? 'A' : 
           score / maxScore >= 0.6 ? 'B' : 'C',
  };
};
```

## Continuous Testing Integration

Make testing part of every Claude Code operation:

```bash
# .claude/workflows/test-driven-development.sh
#!/bin/bash

# 1. Write failing test
claude -p "Write a failing test for: $1"

# 2. Run test to confirm it fails
npm test -- --testNamePattern="$1"

# 3. Implement feature
claude -p "Implement the feature to make the test pass: $1"

# 4. Run test to confirm it passes
npm test -- --testNamePattern="$1"

# 5. Refactor if needed
claude -p "Refactor the implementation while keeping tests green"

# 6. Run all tests
npm test
```

## The Path Forward

Testing isn't just about catching bugs—it's about encoding knowledge. Every test you write teaches Claude Code more about your application's expected behavior. The better your tests, the better AI can maintain and evolve your code.

In the next chapter, we'll explore how to build the complete Issue-to-PR pipeline, where comprehensive testing becomes the foundation of autonomous development.

Remember: In the age of AI development, tests aren't just safety nets—they're specifications. Write them accordingly.

---

*Continue to Chapter 7: The Issue-to-PR Pipeline →*
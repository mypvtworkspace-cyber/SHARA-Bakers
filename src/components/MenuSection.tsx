import React, { useState, useMemo } from 'react';
import { Search, ShoppingBag, Flame, Sparkles, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCategory, Product } from '../types';
import { resolveProductImage, getCategoryFallback } from '../services/imageResolver';

export const MenuSection: React.FC = () => {
  const { products, addToCart, setIsMatkaModalOpen } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Complete Menu' },
    { id: 'matka-pizza', label: 'Matka Pizza' },
    { id: 'bakery', label: 'Fresh Bakery' },
    { id: 'cakes', label: 'Celebration Cakes' },
    { id: 'sweets', label: 'Traditional Sweets' },
    { id: 'beverages', label: 'Beverages' },
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (!item) return false;
      const itemCategory = item.category || 'bakery';
      const itemName = item.name || '';
      const itemDesc = item.description || '';
      const matchesCategory = selectedCategory === 'all' || 
                              itemCategory === selectedCategory ||
                              (selectedCategory === 'sweets' && item.id === 'prod-cake-three-milk');
      const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            itemDesc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleProductAction = (product: Product) => {
    if (!product) return;
    if (product.productType === 'MATKA_PIZZA') {
      setIsMatkaModalOpen(true);
      return;
    }
    const safeCategory = product.category || 'bakery';
    addToCart({
      productId: product.id,
      productName: product.name || 'Bakery Item',
      category: safeCategory,
      unitPrice: product.basePrice ?? 0,
      quantity: 1,
      image: resolveProductImage(product.image, safeCategory),
    });

    setRecentlyAddedId(product.id);
    setTimeout(() => {
      setRecentlyAddedId((curr) => (curr === product.id ? null : curr));
    }, 1200);
  };

  return (
    <section id="menu" className="py-16 md:py-24 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-900 mb-1">
              <span>Sahara Bakers Kitchen & Oven</span>
              <span aria-hidden="true">•</span>
              <span>Prepared Daily in Bannu</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-stone-950">
              Fresh Daily Menu
            </h2>
            <p className="text-stone-600 text-sm mt-1 max-w-xl">
              Authentic clay-baked pizzas, freshly whipped celebration cakes, golden layered bakery snacks, and pure khoya mithai.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cakes, snacks, pizza..."
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700"
            />
          </div>
        </div>

        {/* Interactive Category Segmented Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-amber-800 text-white shadow-sm'
                    : 'bg-white text-stone-700 hover:text-stone-900 border border-stone-200 hover:border-stone-300'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center max-w-md mx-auto">
            <p className="text-stone-500 text-sm">No items found matching your criteria.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-3 text-xs font-semibold text-amber-800 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product, index) => {
              const safeCategory = product.category || 'bakery';
              const resolvedImg = resolveProductImage(product.image, safeCategory);
              const fallbackImg = getCategoryFallback(safeCategory);
              const isAdded = recentlyAddedId === product.id;

              return (
                <div
                  key={product.id || index}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="group bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col justify-between bakery-product-card animate-bakery-fade-up"
                >
                  {/* Product Image */}
                  <div className="relative aspect-[4/3] bg-stone-100 bakery-image-container rounded-t-xl">
                    <img
                      src={resolvedImg}
                      alt={product.name || 'Bakery Item'}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.endsWith(fallbackImg)) {
                          target.src = fallbackImg;
                        }
                      }}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover bakery-image-card ${
                        safeCategory === 'cakes'
                          ? 'bakery-image-cake'
                          : safeCategory === 'sweets'
                          ? 'bakery-image-sweets'
                          : safeCategory === 'bakery'
                          ? 'bakery-image-bakery'
                          : 'bakery-image-default'
                      }`}
                    />
                    {product.isSignature && (
                      <div className="absolute top-3 left-3 bg-amber-900/90 text-amber-100 text-[11px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>Signature Clay Pot</span>
                      </div>
                    )}
                    {product.isFeatured && !product.isSignature && (
                      <div className="absolute top-3 left-3 bg-stone-900/80 text-white text-[11px] font-medium px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Bakery Favorite</span>
                      </div>
                    )}
                    {!product.available && (
                      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-red-700 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded">
                          Currently Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500 uppercase font-medium mb-1">
                        <span>{safeCategory.replace(/-/g, ' ')}</span>
                        {product.unit && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span>{product.unit}</span>
                          </>
                        )}
                        {product.prepTimeMinutes && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span>~{product.prepTimeMinutes} mins</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-stone-900 font-display group-hover:text-amber-900 transition-colors">
                        {product.name || 'Bakery Special'}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                        {product.description || ''}
                      </p>
                    </div>

                    {/* Price and Action */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-stone-400 block -mb-0.5">Price</span>
                        <span className="text-lg font-bold font-mono text-stone-950">
                          Rs. {(product.basePrice ?? 0).toLocaleString()}
                        </span>
                      </div>
                      {product.productType === 'MATKA_PIZZA' ? (
                        <button
                          onClick={() => handleProductAction(product)}
                          className="bakery-btn px-3.5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Customize Pot</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleProductAction(product)}
                          disabled={!product.available}
                          className={`bakery-btn px-3.5 py-2 text-xs font-semibold rounded border transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isAdded
                              ? 'bg-green-700 text-white border-green-700 shadow-sm'
                              : 'text-stone-900 bg-stone-100 hover:bg-amber-700 hover:text-white border-stone-200'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added ✓</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};

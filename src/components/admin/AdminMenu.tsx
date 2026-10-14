import React, { useState } from 'react';
import { Plus, Search, Trash2, Power, Edit3, Image as ImageIcon, Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { apiClient } from '../../services/apiClient';
import { FirestoreService } from '../../services/firestoreService';
import { Product, ProductCategory } from '../../types';
import { resolveProductImage, getCategoryFallback, BAKERY_IMAGE_PRESETS, processUploadedImage } from '../../services/imageResolver';

export const AdminMenu: React.FC = () => {
  const { products, refreshData, currentUser } = useApp();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Alerts
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // New product form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('cakes');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(1200);
  const [unit, setUnit] = useState('1 Kg');
  const [selectedImage, setSelectedImage] = useState<string>(BAKERY_IMAGE_PRESETS[1].path);

  // Edit product form state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ProductCategory>('cakes');
  const [editDescription, setEditDescription] = useState('');
  const [editBasePrice, setEditBasePrice] = useState<number>(0);
  const [editUnit, setEditUnit] = useState('');
  const [editImage, setEditImage] = useState('');

  const filteredProducts = products.filter(p => {
    if (!p) return false;
    const pCat = p.category || 'bakery';
    const pName = p.name || '';
    const pDesc = p.description || '';
    const matchesCat = filterCategory === 'all' || pCat === filterCategory;
    const matchesQuery = !searchQuery.trim() || 
      pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pDesc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleFileUpload = async (file: File, isEdit: boolean) => {
    setIsUploading(true);
    try {
      const res = await processUploadedImage(file);
      if (res.success && res.dataUrl) {
        if (isEdit) {
          setEditImage(res.dataUrl);
        } else {
          setSelectedImage(res.dataUrl);
        }
        showFeedback('success', 'Image uploaded and processed for persistent display.');
      } else {
        showFeedback('error', res.error || 'Failed to upload image.');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Image processing error.');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleAvailability = async (prodId: string) => {
    const list = storage.getProducts();
    const idx = list.findIndex(p => p.id === prodId);
    if (idx === -1) return;
    const prev = list[idx].available;
    const newAvail = !prev;
    list[idx].available = newAvail;
    storage.saveProducts(list);

    // Sync to Central Persistent Server & Firestore
    FirestoreService.saveProduct(list[idx]).catch(() => {});
    try {
      await apiClient.updateProductAvailability(prodId, newAvail, currentUser ? {
        email: currentUser.email,
        role: currentUser.role,
      } : undefined);
    } catch (err) {
      console.warn('[AdminMenu] Server sync fallback:', err);
    }

    if (currentUser) {
      storage.addAuditLog({
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'PRODUCT_AVAILABILITY_TOGGLE',
        targetResource: `PRODUCT_${list[idx].name}`,
        previousValue: String(prev),
        newValue: String(newAvail),
      });
    }

    await refreshData();
    showFeedback('success', `Product status set to ${newAvail ? 'In Stock' : 'Sold Out'}.`);
  };

  const handleUpdatePrice = async (prodId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice <= 0) return;
    const list = storage.getProducts();
    const idx = list.findIndex(p => p.id === prodId);
    if (idx === -1) return;
    const oldPrice = list[idx].basePrice;
    list[idx].basePrice = newPrice;
    storage.saveProducts(list);

    // Sync to Central Persistent Server & Firestore
    FirestoreService.saveProduct(list[idx]).catch(() => {});
    try {
      await apiClient.updateProductPrice(prodId, newPrice, currentUser ? {
        email: currentUser.email,
        role: currentUser.role,
      } : undefined);
    } catch (err) {
      console.warn('[AdminMenu] Server sync fallback:', err);
    }

    if (currentUser) {
      storage.addAuditLog({
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'PRODUCT_PRICE_UPDATE',
        targetResource: `PRODUCT_${list[idx].name}`,
        previousValue: `Rs. ${oldPrice}`,
        newValue: `Rs. ${newPrice}`,
      });
    }

    await refreshData();
    showFeedback('success', 'Price updated successfully on central database.');
  };

  const handleDeleteProduct = async (prodId: string, prodName: string) => {
    if (prodId === 'prod-matka-pizza') {
      alert('Cannot delete flagship signature Matka Pizza.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${prodName}" from the menu?`)) {
      return;
    }
    const list = storage.getProducts().filter(p => p.id !== prodId);
    storage.saveProducts(list);

    // Sync to Central Persistent Server
    try {
      await apiClient.deleteProduct(prodId, currentUser ? {
        email: currentUser.email,
        role: currentUser.role,
      } : undefined);
    } catch (err) {
      console.warn('[AdminMenu] Server sync fallback:', err);
    }

    if (currentUser) {
      storage.addAuditLog({
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'PRODUCT_DELETE',
        targetResource: `PRODUCT_${prodName}`,
      });
    }

    await refreshData();
    showFeedback('success', `"${prodName}" deleted successfully.`);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const list = storage.getProducts();
      const newProd: Product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        category,
        productType: category === 'matka-pizza' ? 'MATKA_PIZZA' : category === 'cakes' ? 'CAKE' : category === 'sweets' ? 'SWEETS' : category === 'beverages' ? 'DRINK' : 'BAKERY',
        description: description.trim(),
        basePrice,
        image: selectedImage || getCategoryFallback(category),
        available: true,
        unit,
        prepTimeMinutes: 15,
      };
      list.push(newProd);
      storage.saveProducts(list);

      // Sync to Central Persistent Server & Firestore
      FirestoreService.saveProduct(newProd).catch(() => {});
      try {
        await apiClient.createProduct(newProd, currentUser ? {
          email: currentUser.email,
          role: currentUser.role,
        } : undefined);
      } catch (err) {
        console.warn('[AdminMenu] Server sync fallback:', err);
      }

      if (currentUser) {
        storage.addAuditLog({
          actorEmail: currentUser.email,
          actorRole: currentUser.role,
          action: 'PRODUCT_CREATE',
          targetResource: `PRODUCT_${newProd.name}`,
          newValue: `Price: Rs. ${newProd.basePrice}, Image: ${newProd.image}`,
        });
      }

      await refreshData();
      setIsAddingNew(false);
      setName('');
      setDescription('');
      setBasePrice(1200);
      showFeedback('success', `"${newProd.name}" added to menu catalog with persistent image!`);
    } catch (err: any) {
      showFeedback('error', 'Failed to save product: ' + err.message);
    }
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditCategory(prod.category);
    setEditDescription(prod.description);
    setEditBasePrice(prod.basePrice);
    setEditUnit(prod.unit || '1 Piece');
    setEditImage(prod.image);
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const list = storage.getProducts();
      const idx = list.findIndex(p => p.id === editingProduct.id);
      if (idx === -1) {
        showFeedback('error', 'Product not found.');
        return;
      }

      const prev = { ...list[idx] };
      list[idx] = {
        ...list[idx],
        name: editName.trim(),
        category: editCategory,
        description: editDescription.trim(),
        basePrice: Number(editBasePrice),
        unit: editUnit.trim() || undefined,
        image: editImage.trim() || getCategoryFallback(editCategory),
      };

      storage.saveProducts(list);

      // Sync to Central Persistent Server & Firestore
      FirestoreService.saveProduct(list[idx]).catch(() => {});
      try {
        await apiClient.updateProduct(list[idx].id, list[idx], currentUser ? {
          email: currentUser.email,
          role: currentUser.role,
        } : undefined);
      } catch (err) {
        console.warn('[AdminMenu] Server sync fallback:', err);
      }

      if (currentUser) {
        storage.addAuditLog({
          actorEmail: currentUser.email,
          actorRole: currentUser.role,
          action: 'PRODUCT_UPDATE',
          targetResource: `PRODUCT_${list[idx].name}`,
          previousValue: `Price: ${prev.basePrice}, Img: ${prev.image}`,
          newValue: `Price: ${list[idx].basePrice}, Img: ${list[idx].image}`,
        });
      }

      await refreshData();
      setEditingProduct(null);
      showFeedback('success', `"${list[idx].name}" updated on central persistent database.`);
    } catch (err: any) {
      showFeedback('error', 'Failed to update product: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-stone-900">
            Menu Catalog & Bakery Images Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Authoritative product database, persistent image assets, stock availability & category assignments
          </p>
        </div>
        <button
          onClick={() => {
            setIsAddingNew(true);
            setSelectedImage(BAKERY_IMAGE_PRESETS[1].path);
          }}
          className="bakery-btn inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Bakery Product</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
          feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'cakes', 'sweets', 'bakery', 'matka-pizza', 'beverages'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterCategory === cat
                  ? 'bg-amber-800 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200'
              }`}
            >
              {cat === 'all' ? 'All Items' : (cat || '').replace(/-/g, ' ')}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cakes, snacks, mithai..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
          />
        </div>
      </div>

      {/* Add New Product Form */}
      {isAddingNew && (
        <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-md space-y-5 animate-bakery-fade-up">
          <div className="flex justify-between items-center border-b border-stone-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Add New Bakery Product to Sahara Bakers</h3>
              <p className="text-xs text-stone-500">Assign dedicated image, category, and portion details</p>
            </div>
            <button onClick={() => setIsAddingNew(false)} className="text-stone-400 hover:text-stone-700 text-xs font-bold p-1">✕</button>
          </div>
          
          <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vanilla Birthday Sponge Cake"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                >
                  <option value="cakes">Celebration Cakes</option>
                  <option value="sweets">Traditional Sweets / Mithai</option>
                  <option value="bakery">Fresh Bakery & Pastries</option>
                  <option value="matka-pizza">Matka Pizza</option>
                  <option value="beverages">Beverages</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Base Price (PKR) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Portion / Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. 1 Kg, 1 Slice, 1 Piece"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-semibold text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Artisanal recipe details, fillings, aroma notes..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
            </div>

            {/* IMAGE SELECTION & UPLOAD SECTION */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <span className="font-bold text-stone-900 block flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-700" />
                <span>Product Image Selection (Persistent Storage)</span>
              </span>

              {/* Live Preview */}
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-stone-300 bg-stone-200 shrink-0">
                  <img
                    src={resolveProductImage(selectedImage, category)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-xs cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Processing File...' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, false);
                      }}
                    />
                  </label>
                  <p className="text-[11px] text-stone-500">
                    Supports JPG, PNG, WebP up to 4MB. Converted to persistent storage.
                  </p>
                  <input
                    type="text"
                    value={selectedImage}
                    onChange={(e) => setSelectedImage(e.target.value)}
                    placeholder="Or paste image URL / asset path..."
                    className="w-full p-2 bg-white border border-stone-300 rounded font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Quick Select Presets */}
              <div>
                <span className="text-[11px] font-semibold text-stone-600 block mb-1.5">
                  Or select from authentic Sahara Bakers bakery photo presets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BAKERY_IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedImage(preset.path)}
                      className={`p-1.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                        selectedImage === preset.path ? 'border-amber-700 bg-amber-100/70 font-bold' : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <img
                        src={resolveProductImage(preset.path, preset.category)}
                        alt={preset.name}
                        className="w-8 h-8 rounded object-cover shrink-0"
                      />
                      <span className="text-[10px] truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bakery-btn px-6 py-2 text-white bg-amber-700 hover:bg-amber-800 rounded-lg font-semibold shadow"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-stone-900">
                  Edit Product: {editingProduct.name}
                </h3>
                <p className="text-xs text-stone-500">Update product information or replace image</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1">✕</button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ProductCategory)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg"
                  >
                    <option value="cakes">Celebration Cakes</option>
                    <option value="sweets">Traditional Sweets / Mithai</option>
                    <option value="bakery">Fresh Bakery & Pastries</option>
                    <option value="matka-pizza">Matka Pizza</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Base Price (PKR)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editBasePrice}
                    onChange={(e) => setEditBasePrice(Number(e.target.value))}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Portion / Unit</label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-stone-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              {/* IMAGE EDITING & PREVIEW */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <span className="font-bold text-stone-900 block flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-700" />
                  <span>Update Product Image</span>
                </span>

                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-stone-300 bg-stone-200 shrink-0">
                    <img
                      src={resolveProductImage(editImage, editCategory)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-xs cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Uploading...' : 'Upload Replacement File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, true);
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      value={editImage}
                      onChange={(e) => setEditImage(e.target.value)}
                      placeholder="Image URL or relative path..."
                      className="w-full p-2 bg-white border border-stone-300 rounded font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Presets */}
                <div>
                  <span className="text-[11px] font-semibold text-stone-600 block mb-1.5">
                    Select from standard bakery presets:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BAKERY_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setEditImage(preset.path)}
                        className={`p-1.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                          editImage === preset.path ? 'border-amber-700 bg-amber-100/70 font-bold' : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <img
                          src={resolveProductImage(preset.path, preset.category)}
                          alt={preset.name}
                          className="w-7 h-7 rounded object-cover shrink-0"
                        />
                        <span className="text-[10px] truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bakery-btn px-6 py-2 text-white bg-amber-700 hover:bg-amber-800 rounded-lg font-semibold shadow"
                >
                  Update & Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Catalog Table with Thumbnails & Edit Button */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
              <tr>
                <th className="px-5 py-3">Product Photo</th>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price (PKR)</th>
                <th className="px-5 py-3">Portion</th>
                <th className="px-5 py-3">Availability</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-stone-50/70">
                  <td className="px-5 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                      <img
                        src={resolveProductImage(prod.image, prod.category || 'bakery')}
                        alt={prod.name || 'Bakery Item'}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = getCategoryFallback(prod.category || 'bakery');
                          if (!target.src.endsWith(fallback)) {
                            target.src = fallback;
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-stone-900">{prod.name || 'Bakery Item'}</div>
                    <div className="text-[11px] text-stone-500 line-clamp-1">{prod.description || ''}</div>
                  </td>
                  <td className="px-5 py-3.5 uppercase text-[10px] font-semibold text-stone-600">
                    {prod.category || 'bakery'}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-stone-900">
                    <div className="flex items-center gap-1.5">
                      <span>Rs.</span>
                      <input
                        type="number"
                        defaultValue={prod.basePrice}
                        onBlur={(e) => handleUpdatePrice(prod.id, Number(e.target.value))}
                        className="w-24 p-1 bg-stone-50 border border-stone-200 rounded font-mono font-bold text-xs"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-stone-600">
                    {prod.unit || 'Standard'}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleAvailability(prod.id)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                        prod.available
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {prod.available ? 'In Stock' : 'Sold Out'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditModal(prod)}
                      className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-stone-100 rounded transition-colors"
                      title="Edit product and image"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAvailability(prod.id)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                      title="Toggle availability"
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    {prod.id !== 'prod-matka-pizza' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-stone-100 rounded transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

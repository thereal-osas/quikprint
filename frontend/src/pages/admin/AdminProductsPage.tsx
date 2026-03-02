import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  useAdminProducts,
  useAdminCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useProductPricing,
  useSetDimensionalPricing,
  useDeleteDimensionalPricing,
  useSetPricingTiers,
  useDeletePricingTiers,
  useBulkUpdatePrice,
  useShippingConfigAdmin,
  useUpdateShippingConfig,
} from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2, Upload, X, PlusCircle, Star, Search, Filter, DollarSign, Truck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { filesApi, type ProductResponse } from '@/services/api';

// Pricing Tier for quantity-based pricing
interface PricingTierFormData {
  minQty: string;
  maxQty: string;
  price: string;
}

// Dimensional Pricing for area-based pricing
interface DimensionalPricingFormData {
  ratePerUnit: string;
  unit: 'sqft' | 'sqin' | 'sqm' | 'sqcm';
  minCharge: string;
}

interface FormData {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  shortDescription: string;
  basePrice: string;
  turnaround: string;
  minQuantity: string;
  images: string[];
  pricingType: 'quantity' | 'dimensional';
  pricingTiers: PricingTierFormData[];
  dimensionalPricing: DimensionalPricingFormData;
}

const emptyDimensionalPricing: DimensionalPricingFormData = {
  ratePerUnit: '',
  unit: 'sqin',
  minCharge: '0',
};

const emptyPricingTier: PricingTierFormData = {
  minQty: '',
  maxQty: '',
  price: '',
};

const emptyForm: FormData = {
  name: '',
  slug: '',
  categoryId: '',
  description: '',
  shortDescription: '',
  basePrice: '',
  turnaround: '',
  minQuantity: '1',
  images: [],
  pricingType: 'quantity',
  pricingTiers: [],
  dimensionalPricing: emptyDimensionalPricing,
};

export default function AdminProductsPage() {
  const { data: products, isLoading } = useAdminProducts();
  const { data: categories } = useAdminCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const setDimensionalPricingMutation = useSetDimensionalPricing();
  const deleteDimensionalPricingMutation = useDeleteDimensionalPricing();
  const setPricingTiersMutation = useSetPricingTiers();
  const deletePricingTiersMutation = useDeletePricingTiers();
  const bulkUpdatePriceMutation = useBulkUpdatePrice();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk update state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [bulkUpdateType, setBulkUpdateType] = useState<'set' | 'increase' | 'decrease' | 'percentage'>('set');
  const [bulkUpdateValue, setBulkUpdateValue] = useState('');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Shipping config state
  const { data: shippingConfig } = useShippingConfigAdmin();
  const updateShippingConfigMutation = useUpdateShippingConfig();
  const [isShippingConfigOpen, setIsShippingConfigOpen] = useState(false);
  const [shippingFee, setShippingFee] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('');

  // Load shipping config into form when dialog opens
  useEffect(() => {
    if (isShippingConfigOpen && shippingConfig) {
      setShippingFee(shippingConfig.shippingFee.toString());
      setFreeShippingThreshold(shippingConfig.freeShippingThreshold.toString());
    }
  }, [isShippingConfigOpen, shippingConfig]);

  // Filtered products based on search and filters
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      // Search filter - check name and description
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesSearch =
          product.name.toLowerCase().includes(query) ||
          (product.description || '').toLowerCase().includes(query) ||
          (product.category || '').toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter && categoryFilter !== 'all') {
        if (product.categoryId !== categoryFilter) return false;
      }

      // Price range filter
      const price = product.basePrice || 0;
      if (minPrice && price < parseFloat(minPrice)) return false;
      if (maxPrice && price > parseFloat(maxPrice)) return false;

      return true;
    });
  }, [products, searchQuery, categoryFilter, minPrice, maxPrice]);

  // Reset filters
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setMinPrice('');
    setMaxPrice('');
  };

  // Check if any filter is active
  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || minPrice || maxPrice;

  // Selection helpers
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleAllProducts = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBulkUpdatePrice = async () => {
    if (selectedProducts.size === 0) {
      toast.error('Please select at least one product');
      return;
    }
    const value = parseFloat(bulkUpdateValue);
    if (isNaN(value)) {
      toast.error('Please enter a valid number');
      return;
    }
    try {
      const result = await bulkUpdatePriceMutation.mutateAsync({
        productIds: Array.from(selectedProducts),
        updateType: bulkUpdateType,
        value: value,
      });
      if (result.failedCount > 0) {
        toast.warning(`Updated ${result.updatedCount} products, ${result.failedCount} failed`);
      } else {
        toast.success(`Successfully updated ${result.updatedCount} products`);
      }
      setSelectedProducts(new Set());
      setIsBulkUpdateOpen(false);
      setBulkUpdateValue('');
    } catch (error) {
      console.error('Failed to bulk update prices:', error);
      toast.error('Failed to update prices');
    }
  };

  // Load pricing when editing a product
  const { data: productPricing } = useProductPricing(editingProduct?.id);

  // Update form when pricing data is loaded
  useEffect(() => {
    if (productPricing) {
      // Check if dimensional pricing exists
      if (productPricing.dimensionalPricing) {
        const dp = productPricing.dimensionalPricing;
        setFormData(prev => ({
          ...prev,
          pricingType: 'dimensional',
          dimensionalPricing: {
            ratePerUnit: dp.ratePerUnit.toString(),
            unit: dp.unit as 'sqft' | 'sqin' | 'sqm' | 'sqcm',
            minCharge: dp.minCharge.toString(),
          },
        }));
      }
      // Check if pricing tiers exist
      else if (productPricing.tiers && productPricing.tiers.length > 0) {
        setFormData(prev => ({
          ...prev,
          pricingType: 'quantity',
          pricingTiers: productPricing.tiers!.map(t => ({
            minQty: t.minQty.toString(),
            maxQty: t.maxQty.toString(),
            price: t.price.toString(),
          })),
        }));
      }
    }
  }, [productPricing]);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingProduct(null);
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    console.log(`Uploading ${files.length} file(s)...`);
    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);
        return filesApi.upload(file);
      });
      const results = await Promise.all(uploadPromises);
      console.log('Upload results:', results);

      // Build full URL for uploaded images (backend returns relative path like /uploads/...)
      const newImageUrls = results.map(r => {
        // If fileUrl already contains the full URL, use it; otherwise prepend API base URL
        const url = r.fileUrl.startsWith('http') ? r.fileUrl : `http://localhost:8080${r.fileUrl}`;
        console.log(`Image URL: ${url}`);
        return url;
      });

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls],
      }));
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload images. Check console for details.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Set an image as primary (move it to index 0)
  const setPrimaryImage = (index: number) => {
    if (index === 0) return; // Already primary
    setFormData(prev => {
      const newImages = [...prev.images];
      const [selectedImage] = newImages.splice(index, 1);
      newImages.unshift(selectedImage);
      return { ...prev, images: newImages };
    });
    toast.success('Primary image updated');
  };

  // Pricing tier handlers
  const addPricingTier = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      pricingTiers: [...prev.pricingTiers, { ...emptyPricingTier }],
    }));
  }, []);

  const removePricingTier = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      pricingTiers: prev.pricingTiers.filter((_, i) => i !== index),
    }));
  }, []);

  const updatePricingTier = useCallback((index: number, field: keyof PricingTierFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      pricingTiers: prev.pricingTiers.map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier
      ),
    }));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Log form data for debugging
    console.log('Creating product with form data:', {
      name: formData.name,
      slug: formData.slug,
      categoryId: formData.categoryId,
      basePrice: formData.basePrice,
      images: formData.images,
      pricingType: formData.pricingType,
    });

    try {
      const productData = {
        name: formData.name,
        slug: formData.slug,
        categoryId: formData.categoryId,
        description: formData.description,
        shortDescription: formData.shortDescription,
        basePrice: parseFloat(formData.basePrice) || 0,
        turnaround: formData.turnaround,
        minQuantity: parseInt(formData.minQuantity) || 1,
        images: formData.images,
        options: [], // No more dynamic options
      };

      console.log('Sending product data to API:', productData);
      const product = await createMutation.mutateAsync(productData);
      console.log('Product created successfully:', product);

      // Save pricing based on type
      if (product?.id) {
        try {
          if (formData.pricingType === 'dimensional') {
            await setDimensionalPricingMutation.mutateAsync({
              productId: product.id,
              data: {
                ratePerUnit: parseFloat(formData.dimensionalPricing.ratePerUnit) || 0,
                unit: formData.dimensionalPricing.unit,
                minCharge: parseFloat(formData.dimensionalPricing.minCharge) || 0,
              },
            });
          } else if (formData.pricingType === 'quantity' && formData.pricingTiers.length > 0) {
            // Filter out empty tiers and validate required fields
            // Note: maxQty can be empty for unlimited tiers (e.g., "50+")
            const validTiers = formData.pricingTiers
              .filter(t => t.minQty && t.price)
              .map(t => ({
                minQty: parseInt(t.minQty) || 0,
                maxQty: t.maxQty ? parseInt(t.maxQty) : 0, // 0 means unlimited
                price: parseFloat(t.price) || 0,
              }));
            
            if (validTiers.length > 0) {
              await setPricingTiersMutation.mutateAsync({ productId: product.id, tiers: validTiers });
            }
          }
        } catch (pricingError) {
          console.error('Failed to set pricing:', pricingError);
          toast.error('Product created but failed to set pricing. Please update pricing manually.');
        }
      }

      toast.success('Product created successfully');
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Failed to create product. Check console for details.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await updateMutation.mutateAsync({
        id: editingProduct.id,
        data: {
          name: formData.name,
          slug: formData.slug,
          categoryId: formData.categoryId,
          description: formData.description,
          shortDescription: formData.shortDescription,
          basePrice: parseFloat(formData.basePrice) || 0,
          turnaround: formData.turnaround,
          minQuantity: parseInt(formData.minQuantity) || 1,
          images: formData.images,
          options: [], // No more dynamic options
        },
      });

      // Handle pricing based on type
      try {
        if (formData.pricingType === 'dimensional') {
          // Set dimensional pricing
          await setDimensionalPricingMutation.mutateAsync({
            productId: editingProduct.id,
            data: {
              ratePerUnit: parseFloat(formData.dimensionalPricing.ratePerUnit) || 0,
              unit: formData.dimensionalPricing.unit,
              minCharge: parseFloat(formData.dimensionalPricing.minCharge) || 0,
            },
          });
          // Clear pricing tiers if they existed
          if (productPricing?.tiers && productPricing.tiers.length > 0) {
            await deletePricingTiersMutation.mutateAsync(editingProduct.id);
          }
        } else if (formData.pricingType === 'quantity') {
          // Set pricing tiers
          if (formData.pricingTiers.length > 0) {
            // Filter out empty tiers and validate required fields
            // Note: maxQty can be empty for unlimited tiers (e.g., "50+")
            const validTiers = formData.pricingTiers
              .filter(t => t.minQty && t.price)
              .map(t => ({
                minQty: parseInt(t.minQty) || 0,
                maxQty: t.maxQty ? parseInt(t.maxQty) : 0, // 0 means unlimited
                price: parseFloat(t.price) || 0,
              }));
            
            if (validTiers.length > 0) {
              await setPricingTiersMutation.mutateAsync({ productId: editingProduct.id, tiers: validTiers });
            }
          }
          // Clear dimensional pricing if it existed
          if (productPricing?.dimensionalPricing) {
            await deleteDimensionalPricingMutation.mutateAsync(editingProduct.id);
          }
        }
      } catch (pricingError) {
        console.error('Failed to update pricing:', pricingError);
        toast.error('Product updated but failed to set pricing. Please update pricing manually.');
      }

      toast.success('Product updated successfully');
      setEditingProduct(null);
      resetForm();
    } catch {
      toast.error('Failed to update product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Product deleted successfully');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const openEdit = (product: ProductResponse) => {
    setEditingProduct(product);
    // Default to quantity pricing; will be updated by useEffect when pricing data loads
    setFormData({
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      basePrice: product.basePrice?.toString() || '0',
      turnaround: product.turnaround || '',
      minQuantity: product.minQuantity?.toString() || '1',
      images: product.images || [],
      pricingType: 'quantity',
      pricingTiers: [],
      dimensionalPricing: emptyDimensionalPricing, // Will be loaded from API
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Helper to render the form - using a function that returns JSX instead of a component
  // to avoid focus loss issues caused by component recreation on each render
  const renderProductForm = (isEdit: boolean, onSubmit: (e: React.FormEvent) => void, isPending: boolean) => (
    <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={isEdit ? 'edit-name' : 'name'}>Name</Label>
          <Input
            id={isEdit ? 'edit-name' : 'name'}
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor={isEdit ? 'edit-slug' : 'slug'}>Slug</Label>
          <Input
            id={isEdit ? 'edit-slug' : 'slug'}
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={isEdit ? 'edit-category' : 'category'}>Category</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={isEdit ? 'edit-price' : 'price'}>Base Price (₦)</Label>
          <Input
            id={isEdit ? 'edit-price' : 'price'}
            type="number"
            step="0.01"
            value={formData.basePrice}
            onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
            required
          />
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <Label className="text-base font-semibold">Product Images</Label>
        <p className="text-xs text-muted-foreground">First image is the primary/thumbnail image. Click the star to set as primary.</p>
        <div className="flex flex-wrap gap-2">
          {formData.images.map((img, index) => (
            <div
              key={index}
              className={`relative group w-20 h-20 border-2 rounded overflow-hidden ${
                index === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              }`}
            >
              <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
              {/* Primary indicator */}
              {index === 0 && (
                <div className="absolute top-0 left-0 bg-primary text-primary-foreground p-0.5">
                  <Star className="h-3 w-3 fill-current" />
                </div>
              )}
              {/* Set as primary button (shown on hover for non-primary images) */}
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => setPrimaryImage(index)}
                  className="absolute top-0 left-0 bg-muted text-muted-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
                  title="Set as primary image"
                >
                  <Star className="h-3 w-3" />
                </button>
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-0 right-0 bg-destructive text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="w-20 h-20 border-2 border-dashed border-border rounded flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </label>
        </div>
      </div>

      {/* Short Description */}
      <div>
        <Label htmlFor={isEdit ? 'edit-short-desc' : 'short-desc'}>Short Description</Label>
        <Input
          id={isEdit ? 'edit-short-desc' : 'short-desc'}
          value={formData.shortDescription}
          onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor={isEdit ? 'edit-desc' : 'desc'}>Description</Label>
        <Textarea
          id={isEdit ? 'edit-desc' : 'desc'}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={isEdit ? 'edit-turnaround' : 'turnaround'}>Turnaround Time</Label>
          <Input
            id={isEdit ? 'edit-turnaround' : 'turnaround'}
            value={formData.turnaround}
            onChange={(e) => setFormData(prev => ({ ...prev, turnaround: e.target.value }))}
            placeholder="e.g., 3-5 business days"
          />
        </div>
        <div>
          <Label htmlFor={isEdit ? 'edit-min-qty' : 'min-qty'}>Min Quantity</Label>
          <Input
            id={isEdit ? 'edit-min-qty' : 'min-qty'}
            type="number"
            value={formData.minQuantity}
            onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: e.target.value }))}
          />
        </div>
      </div>

      {/* Pricing Type Selection */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <Label className="text-base font-semibold">Pricing Type</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`pricingType-${isEdit ? 'edit' : 'create'}`}
              value="quantity"
              checked={formData.pricingType === 'quantity'}
              onChange={() => setFormData(prev => ({ ...prev, pricingType: 'quantity' }))}
              className="w-4 h-4"
            />
            <span className="text-sm">Quantity-Based Pricing</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`pricingType-${isEdit ? 'edit' : 'create'}`}
              value="dimensional"
              checked={formData.pricingType === 'dimensional'}
              onChange={() => setFormData(prev => ({ ...prev, pricingType: 'dimensional' }))}
              className="w-4 h-4"
            />
            <span className="text-sm">Dimensional-Based Pricing</span>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          {formData.pricingType === 'quantity'
            ? 'Product price varies based on quantity ordered (e.g., 100 pcs = ₦5,000, 500 pcs = ₦20,000).'
            : 'Product price calculated based on dimensions (width × height × rate per unit).'}
        </p>
      </div>

      {/* Quantity-Based Pricing Tiers */}
      {formData.pricingType === 'quantity' && (
        <div className="border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Pricing Tiers</Label>
            <Button type="button" variant="outline" size="sm" onClick={addPricingTier}>
              <PlusCircle className="h-4 w-4 mr-1" /> Add Tier
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Define quantity tiers with corresponding prices. The base price above will be used as the default price.
          </p>

          {formData.pricingTiers.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No pricing tiers configured. Click "Add Tier" to create quantity-based pricing.
            </p>
          )}

          {formData.pricingTiers.map((tier, tierIndex) => (
            <div key={tierIndex} className="grid grid-cols-4 gap-2 items-end">
              <div>
                <Label className="text-xs">Min Quantity</Label>
                <Input
                  type="number"
                  value={tier.minQty}
                  onChange={(e) => updatePricingTier(tierIndex, 'minQty', e.target.value)}
                  placeholder="e.g., 100"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Max Quantity</Label>
                <Input
                  type="number"
                  value={tier.maxQty}
                  onChange={(e) => updatePricingTier(tierIndex, 'maxQty', e.target.value)}
                  placeholder="e.g., 499"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Price (₦)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tier.price}
                  onChange={(e) => updatePricingTier(tierIndex, 'price', e.target.value)}
                  placeholder="e.g., 5000"
                  className="h-9"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePricingTier(tierIndex)}
                className="h-9 w-9 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Dimensional Pricing Section */}
      {formData.pricingType === 'dimensional' && (
        <div className="border border-border rounded-lg p-4 space-y-4">
          <Label className="text-base font-semibold">Dimensional Pricing Configuration</Label>
          <p className="text-xs text-muted-foreground">
            Configure pricing based on area (width × height) for products like banners, posters, or signage.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <Label htmlFor={`rate-per-unit-${isEdit ? 'edit' : 'create'}`} className="text-xs">Rate per Unit (₦)</Label>
              <Input
                id={`rate-per-unit-${isEdit ? 'edit' : 'create'}`}
                type="number"
                step="0.01"
                value={formData.dimensionalPricing.ratePerUnit}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dimensionalPricing: { ...prev.dimensionalPricing, ratePerUnit: e.target.value },
                }))}
                placeholder="e.g., 50"
              />
            </div>
            <div>
              <Label htmlFor={`pricing-unit-${isEdit ? 'edit' : 'create'}`} className="text-xs">Unit</Label>
              <Select
                value={formData.dimensionalPricing.unit}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  dimensionalPricing: { ...prev.dimensionalPricing, unit: value as 'sqft' | 'sqin' | 'sqm' | 'sqcm' },
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqin">Square Inches (sqin)</SelectItem>
                  <SelectItem value="sqft">Square Feet (sqft)</SelectItem>
                  <SelectItem value="sqcm">Square Centimeters (sqcm)</SelectItem>
                  <SelectItem value="sqm">Square Meters (sqm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`min-charge-${isEdit ? 'edit' : 'create'}`} className="text-xs">Minimum Charge (₦)</Label>
              <Input
                id={`min-charge-${isEdit ? 'edit' : 'create'}`}
                type="number"
                step="0.01"
                value={formData.dimensionalPricing.minCharge}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dimensionalPricing: { ...prev.dimensionalPricing, minCharge: e.target.value },
                }))}
                placeholder="e.g., 500"
              />
            </div>
          </div>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
      </Button>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your products</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Shipping Config Button */}
          <Dialog open={isShippingConfigOpen} onOpenChange={setIsShippingConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Truck className="h-4 w-4 mr-2" />
                Shipping Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Shipping Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingFee">Standard Shipping Fee (₦)</Label>
                  <Input
                    id="shippingFee"
                    type="number"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                    placeholder="5000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount charged for orders below the free shipping threshold
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freeThreshold">Free Shipping Threshold (₦)</Label>
                  <Input
                    id="freeThreshold"
                    type="number"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    placeholder="50000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Orders above this amount get free shipping
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsShippingConfigOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await updateShippingConfigMutation.mutateAsync({
                        shippingFee: parseFloat(shippingFee) || 0,
                        freeShippingThreshold: parseFloat(freeShippingThreshold) || 0,
                      });
                      toast.success('Shipping configuration updated');
                      setIsShippingConfigOpen(false);
                    } catch {
                      toast.error('Failed to update shipping configuration');
                    }
                  }}
                  disabled={updateShippingConfigMutation.isPending}
                >
                  {updateShippingConfigMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Update Price Button */}
          {selectedProducts.size > 0 && (
            <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Update Price ({selectedProducts.size})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Update Prices</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Update prices for {selectedProducts.size} selected product{selectedProducts.size > 1 ? 's' : ''}
                  </p>

                  <div className="space-y-2">
                    <Label>Update Type</Label>
                    <Select value={bulkUpdateType} onValueChange={(v) => setBulkUpdateType(v as typeof bulkUpdateType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="set">Set exact price</SelectItem>
                        <SelectItem value="increase">Increase by amount</SelectItem>
                        <SelectItem value="decrease">Decrease by amount</SelectItem>
                        <SelectItem value="percentage">Adjust by percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      {bulkUpdateType === 'set' && 'New Price (₦)'}
                      {bulkUpdateType === 'increase' && 'Increase Amount (₦)'}
                      {bulkUpdateType === 'decrease' && 'Decrease Amount (₦)'}
                      {bulkUpdateType === 'percentage' && 'Percentage (use negative for decrease)'}
                    </Label>
                    <Input
                      type="number"
                      step={bulkUpdateType === 'percentage' ? '0.1' : '0.01'}
                      value={bulkUpdateValue}
                      onChange={(e) => setBulkUpdateValue(e.target.value)}
                      placeholder={bulkUpdateType === 'percentage' ? 'e.g., 10 for +10% or -10 for -10%' : '0.00'}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsBulkUpdateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkUpdatePrice} disabled={bulkUpdatePriceMutation.isPending}>
                      {bulkUpdatePriceMutation.isPending ? 'Updating...' : 'Update Prices'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Product</DialogTitle>
              </DialogHeader>
              {renderProductForm(false, handleCreate, createMutation.isPending)}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {renderProductForm(true, handleUpdate, updateMutation.isPending)}
        </DialogContent>
      </Dialog>

      {/* Filter Section */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto h-8 px-2">
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Min Price */}
            <div>
              <Input
                type="number"
                placeholder="Min Price (₦)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            {/* Max Price */}
            <div>
              <Input
                type="number"
                placeholder="Max Price (₦)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {products?.length || 0} products
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                  onCheckedChange={toggleAllProducts}
                  aria-label="Select all products"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className={selectedProducts.has(product.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category || '-'}</TableCell>
                  <TableCell>{formatPrice(product.basePrice)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {hasActiveFilters ? 'No products match your filters' : 'No products found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


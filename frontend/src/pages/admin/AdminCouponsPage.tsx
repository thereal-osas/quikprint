import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from '@/hooks/useApi';
import { toast } from 'sonner';
import type { Coupon } from '@/types/product';

export default function AdminCouponsPage() {
  const { data: coupons, isLoading, error, refetch } = useCoupons();
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();
  
  // Debug logging
  console.log('Coupons data:', coupons);
  console.log('Coupons error:', error);
  console.log('Is loading:', isLoading);
  
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 0,
    perUserLimit: 1,
    validFrom: '',
    validUntil: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        validFrom: formData.validFrom ? new Date(formData.validFrom) : undefined,
        validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
        maxDiscountAmount: formData.maxDiscountAmount > 0 ? formData.maxDiscountAmount : undefined,
        usageLimit: formData.usageLimit > 0 ? formData.usageLimit : undefined,
      };

      if (editingCoupon) {
        await updateMutation.mutateAsync({ id: editingCoupon.id, ...submitData });
        toast.success('Coupon updated successfully');
      } else {
        await createMutation.mutateAsync(submitData);
        toast.success('Coupon created successfully');
      }
      
      setShowForm(false);
      setEditingCoupon(null);
      resetForm();
      refetch();
    } catch (_error) {
      toast.error('Failed to save coupon');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      usageLimit: 0,
      perUserLimit: 1,
      validFrom: '',
      validUntil: '',
      isActive: true,
    });
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      perUserLimit: coupon.perUserLimit,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Coupon deleted successfully');
        refetch();
      } catch (_error) {
        toast.error('Failed to delete coupon');
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const createSampleCoupons = async () => {
    const sampleCoupons = [
      {
        code: 'WELCOME10',
        description: 'Welcome discount for new customers',
        discountType: 'percentage' as const,
        discountValue: 10,
        minOrderAmount: 5000,
        maxDiscountAmount: 2000,
        usageLimit: 100,
        perUserLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
      },
      {
        code: 'BULK20',
        description: '20% off bulk orders over ₦50,000',
        discountType: 'percentage' as const,
        discountValue: 20,
        minOrderAmount: 50000,
        maxDiscountAmount: 10000,
        usageLimit: 50,
        perUserLimit: 3,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: true,
      },
      {
        code: 'FLAT1000',
        description: '₦1,000 off orders over ₦10,000',
        discountType: 'fixed' as const,
        discountValue: 1000,
        minOrderAmount: 10000,
        usageLimit: 200,
        perUserLimit: 2,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        isActive: true,
      },
    ];

    try {
      for (const coupon of sampleCoupons) {
        await createMutation.mutateAsync(coupon);
      }
      toast.success('Sample coupons created successfully');
      refetch();
    } catch (_error) {
      toast.error('Failed to create sample coupons');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading coupons...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <div className="text-lg text-red-500">Failed to load coupons</div>
        <p className="text-gray-500">{(error as Error)?.message || 'Unknown error'}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container-main section-padding">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Coupon Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={createSampleCoupons}>
              Create Sample Coupons
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Coupon
            </Button>
          </div>
        </div>

        {/* Coupon Form */}
        {showForm && (
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., WELCOME10"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the coupon"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="discountType">Discount Type</Label>
                    <select
                      id="discountType"
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="discountValue">
                      Discount Value ({formData.discountType === 'percentage' ? '%' : '₦'})
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                      placeholder={formData.discountType === 'percentage' ? 'e.g., 10' : 'e.g., 1000'}
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minOrderAmount">Minimum Order Amount (₦)</Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })}
                      placeholder="e.g., 5000"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxDiscountAmount">Maximum Discount (₦)</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseFloat(e.target.value) })}
                      placeholder="Optional - e.g., 2000"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
                      placeholder="Total times coupon can be used"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="perUserLimit">Per User Limit</Label>
                    <Input
                      id="perUserLimit"
                      type="number"
                      value={formData.perUserLimit}
                      onChange={(e) => setFormData({ ...formData, perUserLimit: parseInt(e.target.value) })}
                      placeholder="Times a single user can use this coupon"
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="validFrom">Valid From</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="validUntil">Valid Until (Optional)</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCoupon(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        {/* Coupons List */}
        <div className="space-y-4">
          {coupons?.length === 0 ? (
            <Card>
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No coupons found</p>
                <Button onClick={createSampleCoupons}>Create Sample Coupons</Button>
              </div>
            </Card>
          ) : (
            coupons?.map((coupon) => (
              <Card key={coupon.id}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{coupon.code}</h3>
                        <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{coupon.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          {coupon.discountType === 'percentage' 
                            ? `${coupon.discountValue}% off` 
                            : `₦${coupon.discountValue} off`}
                        </span>
                        <span>Min: ₦{coupon.minOrderAmount}</span>
                        {coupon.maxDiscountAmount && (
                          <span>Max: ₦{coupon.maxDiscountAmount}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(coupon.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(coupon)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Used:</span>
                      <span className="ml-2">{coupon.usedCount}/{coupon.usageLimit || '∞'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Per User:</span>
                      <span className="ml-2">{coupon.perUserLimit} times</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Valid:</span>
                      <span className="ml-2">
                        {new Date(coupon.validFrom).toLocaleDateString()} - 
                        {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : 'No expiry'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2">{new Date(coupon.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
    </div>
  );
}

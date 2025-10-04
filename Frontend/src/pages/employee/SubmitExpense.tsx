import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Upload, X, FileText, DollarSign, Calendar, Tag, Eye, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api, Category, OCRData, CreateExpenseData } from "@/lib/api";

const SubmitExpense = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // OCR and categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [ocrResults, setOcrResults] = useState<OCRData[]>([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [selectedFileForOCR, setSelectedFileForOCR] = useState<number | null>(null);

    // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesData = await api.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
      
      // Fallback categories for demo purposes
      const fallbackCategories: Category[] = [
        { 
          id: "1", 
          name: "Travel", 
          description: "Travel expenses", 
          isActive: true,
          companyId: "temp",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          id: "2", 
          name: "Meals & Entertainment", 
          description: "Food and entertainment", 
          isActive: true,
          companyId: "temp",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          id: "3", 
          name: "Office Supplies", 
          description: "Office supplies and equipment", 
          isActive: true,
          companyId: "temp",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          id: "4", 
          name: "Software", 
          description: "Software and subscriptions", 
          isActive: true,
          companyId: "temp",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          id: "5", 
          name: "Equipment", 
          description: "Equipment purchases", 
          isActive: true,
          companyId: "temp",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          id: "6", 
          name: "Training", 
          description: "Training and education", 
          isActive: true,
          companyId: "temp",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          id: "7", 
          name: "Other", 
          description: "Other expenses", 
          isActive: true,
          companyId: "temp",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
      ];
      setCategories(fallbackCategories);
    }
  };

    // OCR Processing function
  const processOCRForFile = async (file: File, index: number) => {
    setIsProcessingOCR(true);
    setSelectedFileForOCR(index);

    try {
      const result = await api.processOCR(file);
      const ocrData = result.ocrData;

      // Auto-fill form fields if OCR found data
      if (ocrData) {
        setOcrResults(prev => {
          const newResults = [...prev];
          newResults[index] = ocrData;
          return newResults;
        });

        // Auto-fill form if fields are empty
        if (!title && ocrData.merchantName) {
          setTitle(`Receipt from ${ocrData.merchantName}`);
        }
        if (!amount && ocrData.totalAmount) {
          setAmount(ocrData.totalAmount.toString());
        }
        if (!date && ocrData.date) {
          setDate(ocrData.date);
        }
        if (!description && ocrData.merchantName) {
          setDescription(`Expense at ${ocrData.merchantName}`);
        }

        toast.success(`OCR processed successfully! Confidence: ${Math.round((ocrData.confidence || 0) * 100)}%`);
      }
    } catch (error) {
      console.error("OCR processing error:", error);
      toast.error("Failed to process OCR");
    } finally {
      setIsProcessingOCR(false);
      setSelectedFileForOCR(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    onDrop: (acceptedFiles) => {
      setFiles((prev) => [...prev, ...acceptedFiles]);
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setOcrResults((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!title || !amount || !category || !date) {
        toast.error("Please fill in all required fields");
        return;
      }

      const expenseData: CreateExpenseData = {
        description: title,
        amount: parseFloat(amount),
        categoryId: category,
        expenseDate: date,
        notes: description || undefined,
        merchantName: ocrResults.length > 0 ? ocrResults[0]?.merchantName : undefined,
      };

      const newExpense = await api.createExpense(expenseData);
      
      // Upload files if any
      if (files.length > 0) {
        await uploadReceiptFiles(newExpense.id);
      }

      toast.success("Expense submitted successfully!");
      navigate("/employee/history");
    } catch (error) {
      console.error("Submit expense error:", error);
      toast.error("Failed to submit expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadReceiptFiles = async (expenseId: string) => {
    for (const file of files) {
      try {
        await api.uploadReceipt(expenseId, file);
      } catch (error) {
        console.error("File upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground">Submit Expense</h1>
          <p className="mt-1 text-muted-foreground">
            Add a new expense for approval
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Expense Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Client dinner at Luigi's"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Amount & Date */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add details about this expense..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Receipts & Documents
                </Label>
                
                <div
                  {...getRootProps()}
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:scale-[1.01] ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {isDragActive
                      ? "Drop files here"
                      : "Drag & drop files or click to browse"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supports: Images, PDF (Max 10MB)
                  </p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                              {ocrResults[index] && (
                                <span className="ml-2">
                                  • OCR: {Math.round((ocrResults[index].confidence || 0) * 100)}% confidence
                                </span>
                              )}
                            </p>
                            {ocrResults[index] && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {ocrResults[index].totalAmount && (
                                  <Badge variant="secondary" className="text-xs">
                                    Amount: ${ocrResults[index].totalAmount}
                                  </Badge>
                                )}
                                {ocrResults[index].merchantName && (
                                  <Badge variant="secondary" className="text-xs">
                                    Merchant: {ocrResults[index].merchantName}
                                  </Badge>
                                )}
                                {ocrResults[index].date && (
                                  <Badge variant="secondary" className="text-xs">
                                    Date: {ocrResults[index].date}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => processOCRForFile(file, index)}
                            disabled={isProcessingOCR}
                            className="text-xs"
                          >
                            {isProcessingOCR && selectedFileForOCR === index ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                            {ocrResults[index] ? "Re-scan" : "OCR Scan"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/employee/history")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-primary shadow-glow"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      Submitting...
                    </motion.div>
                  ) : (
                    "Submit Expense"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default SubmitExpense;

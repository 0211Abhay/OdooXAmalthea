import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Upload, X, FileText, DollarSign, Calendar, Tag } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const SubmitExpense = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Expense submitted successfully!");
    setIsSubmitting(false);
    navigate("/employee/history");
  };

  const categories = [
    "Travel",
    "Meals & Entertainment",
    "Office Supplies",
    "Software",
    "Equipment",
    "Training",
    "Other",
  ];

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
                      <SelectItem key={cat} value={cat}>
                        {cat}
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
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
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

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown, ChevronRight, Upload } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { toggleAdminSection } from "@/lib/features/userSlice";
import { uploadBooksCsv } from "@/lib/api/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Modal from "@/components/ui/modal";
import ModalInformationOk from "@/components/ui/modal/ModalInformationOk";

const csvSchema = z.object({
  csvFile: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "CSV file is required")
    .refine(
      (files) =>
        files[0]?.name.endsWith(".csv") ||
        files[0]?.type === "text/csv",
      "Only .csv files are allowed"
    ),
});

type CsvFormData = z.infer<typeof csvSchema>;

interface BooksManagementSectionProps {
  token: string;
  onLoadingChange: (loading: boolean) => void;
}

export default function BooksManagementSection({
  token,
  onLoadingChange,
}: BooksManagementSectionProps) {
  const dispatch = useAppDispatch();
  const adminSections = useAppSelector((state) => state.user.adminSections);
  const isOpen = adminSections["books"] || false;

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CsvFormData>({
    resolver: zodResolver(csvSchema),
  });

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      type: "success",
      title: "",
      message: "",
    });
  };

  const onSubmit = async (data: CsvFormData) => {
    onLoadingChange(true);
    try {
      const file = data.csvFile[0];
      const result = await uploadBooksCsv(file, token);

      setModalState({
        isOpen: true,
        type: "success",
        title: "Success",
        message: `Books CSV uploaded successfully!\n\nInserted: ${result.inserted}\nUpdated: ${result.updated}\nTotal: ${result.total}`,
      });
      reset();
    } catch (err) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message:
          err instanceof Error ? err.message : "Failed to upload books CSV",
      });
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={() => dispatch(toggleAdminSection("books"))}
        className="border-2 border-black rounded-lg"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <h2 className="text-xl font-mono font-bold">Books Management</h2>
            {isOpen ? (
              <ChevronDown className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-6 w-6" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t-2 border-black p-6 space-y-3">
            <p className="text-sm text-gray-600">
              Upload a GoodReads CSV export to import or update your book
              library. Existing books (matched by GoodReads ID) will be updated.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csvFile" className="font-mono">
                  GoodReads CSV File
                </Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  {...register("csvFile")}
                  className="font-mono"
                />
                {errors.csvFile && (
                  <p className="text-sm text-red-600 font-mono">
                    {errors.csvFile.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="font-mono w-full sm:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                Upload Books CSV
              </Button>
            </form>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Modal isOpen={modalState.isOpen} onClose={handleCloseModal}>
        <ModalInformationOk
          title={modalState.title}
          message={modalState.message}
          variant={modalState.type}
          onClose={handleCloseModal}
        />
      </Modal>
    </>
  );
}

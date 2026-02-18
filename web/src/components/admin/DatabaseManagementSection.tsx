"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown, ChevronRight, Download, Upload } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { toggleAdminSection } from "@/lib/features/userSlice";
import { backupDatabase, restoreDatabase } from "@/lib/api/admin";
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

const restoreSchema = z.object({
  zipFile: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "ZIP file is required")
    .refine(
      (files) =>
        files[0]?.type === "application/zip" ||
        files[0]?.type === "application/x-zip-compressed",
      "Only .zip files are allowed"
    ),
});

type RestoreFormData = z.infer<typeof restoreSchema>;

interface DatabaseManagementSectionProps {
  token: string;
  onLoadingChange: (loading: boolean) => void;
}

export default function DatabaseManagementSection({
  token,
  onLoadingChange,
}: DatabaseManagementSectionProps) {
  const dispatch = useAppDispatch();
  const adminSections = useAppSelector((state) => state.user.adminSections);
  const isOpen = adminSections["database-management"] || false;

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
  } = useForm<RestoreFormData>({
    resolver: zodResolver(restoreSchema),
  });

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      type: "success",
      title: "",
      message: "",
    });
  };

  const handleBackup = async () => {
    onLoadingChange(true);
    try {
      await backupDatabase(token);
      setModalState({
        isOpen: true,
        type: "success",
        title: "Success",
        message: "Database backup downloaded successfully!",
      });
    } catch (err) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message:
          err instanceof Error ? err.message : "Failed to backup database",
      });
    } finally {
      onLoadingChange(false);
    }
  };

  const onRestore = async (data: RestoreFormData) => {
    onLoadingChange(true);
    try {
      const file = data.zipFile[0];
      const result = await restoreDatabase(file, token);

      const summaryMessage = `${result.message}

Users imported: ${result.summary.users_imported}
Users skipped: ${result.summary.users_skipped}
Posts imported: ${result.summary.posts_imported}
Posts skipped: ${result.summary.posts_skipped}

${
  result.summary.skipped_details.length > 0
    ? `Skipped:\n${result.summary.skipped_details.join("\n")}`
    : ""
}`;

      setModalState({
        isOpen: true,
        type: "success",
        title: "Success",
        message: summaryMessage,
      });
      reset();
    } catch (err) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Error",
        message:
          err instanceof Error ? err.message : "Failed to restore database",
      });
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={() => dispatch(toggleAdminSection("database-management"))}
        className="border-2 border-black rounded-lg"
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <h2 className="text-xl font-mono font-bold">Database Management</h2>
            {isOpen ? (
              <ChevronDown className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-6 w-6" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t-2 border-black p-6 space-y-6">
            {/* Backup Section */}
            <div className="space-y-3">
              <h3 className="font-mono font-semibold text-lg">
                Backup Database
              </h3>
              <p className="text-sm text-gray-600">
                Download a ZIP file containing all database tables as CSV files.
              </p>
              <Button
                onClick={handleBackup}
                className="font-mono w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Backup
              </Button>
            </div>

            <hr className="border-t-2 border-gray-300" />

            {/* Restore Section */}
            <div className="space-y-3">
              <h3 className="font-mono font-semibold text-lg">
                Restore Database
              </h3>
              <p className="text-sm text-gray-600">
                Upload a backup ZIP file to restore database records. This will
                append data to existing tables.
              </p>
              <form onSubmit={handleSubmit(onRestore)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zipFile" className="font-mono">
                    Backup ZIP File
                  </Label>
                  <Input
                    id="zipFile"
                    type="file"
                    accept=".zip"
                    {...register("zipFile")}
                    className="font-mono"
                  />
                  {errors.zipFile && (
                    <p className="text-sm text-red-600 font-mono">
                      {errors.zipFile.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="font-mono w-full sm:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Database
                </Button>
              </form>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Success/Error Modal */}
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

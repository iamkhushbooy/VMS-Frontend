"use client";

import { Input } from "@/components/ui/input";
import { InputGroup } from "./FormLayout";
import { FormSection } from "./FormLayout";
import { Info, Image as ImageIcon } from "lucide-react";

interface VehicleIdentitySectionProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isViewMode: boolean;
}

export default function VehicleIdentitySection({
  formData,
  handleInputChange,
  handleImageChange,
  isViewMode
}: VehicleIdentitySectionProps) {
  return (
    <FormSection title="Vehicle Identity" icon={Info}>

      {/* License Plate */}
      <InputGroup label="License Plate" required>
        <Input
          name="licensePlate"
          value={formData.licensePlate}
          onChange={handleInputChange}
          placeholder="e.g. KA01AB1234"
          disabled={isViewMode}
        />
      </InputGroup>

      {/* Make */}
      <InputGroup label="Make" required>
        <Input
          name="make"
          value={formData.make}
          onChange={handleInputChange}

          placeholder="e.g. Toyota"
        />
      </InputGroup>

      {/* Model */}
      <InputGroup label="Model" required>
        <Input
          name="model"
          value={formData.model}
          onChange={handleInputChange}

          placeholder="e.g. Corolla Altis"
        />
      </InputGroup>

      <InputGroup label="Vehicle Image">
          <Input
            type="file"
            accept=".jpg, .jpeg, .png, .webp"
            onChange={handleImageChange}
            className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
      </InputGroup>

    </FormSection>
  );
}

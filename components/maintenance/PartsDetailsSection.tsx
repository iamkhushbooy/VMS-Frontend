"use client"
import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import {
  ItemNameCombobox,
  type ItemDoc,
  type PartEntry,
} from "./MaintenanceShared"

interface PartsDetailProps {
  partEntries: PartEntry[]
  newPart: Omit<PartEntry, "id">
  itemOptions: ItemDoc[]
  handleNewPartChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handlePartItemSelect: (itemId: string) => void
  addPartEntry: () => void
  removePartEntry: (id: string) => void
  isBusy: boolean
  onItemSearch: (query: string) => void  // Modal ki setSearchTerm state ke liye
  itemLoading: boolean
}

export function PartsDetailSection({
  partEntries,
  newPart,
  itemOptions,
  handleNewPartChange,
  handlePartItemSelect,
  addPartEntry,
  removePartEntry,
  isBusy,
  onItemSearch,    // Yahan destructure karein
  itemLoading,
}: PartsDetailProps) {
  return (
    <div className="space-y-4 bg-slate-100/50 p-5 rounded-lg border border-slate-100">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Parts Details
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 border-t border-border pt-4">
        <div className="col-span-2 md:col-span-1">
          <Label className="text-xs">Item Name</Label>
          <ItemNameCombobox
            options={itemOptions}
            value={newPart.item_name}
            onValueChange={handlePartItemSelect}
            onSearchChange={onItemSearch}
            isLoading={itemLoading}
            placeholder="Select Item Code"
            searchPlaceholder="Search by Item Code..."
            displayField="name"
          />
        </div>
        <div>
          <Label className="text-xs">Item Group</Label>
          <Input
            name="item_group"
            value={newPart.item_group}
            className="bg-input"
            disabled={isBusy}
            readOnly
          />
        </div>
        <div>
          <Label className="text-xs">Stock Qty</Label>
          <Input
            name="stock_qty"
            type="number"
            value={newPart.stock_qty}
            className="bg-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            readOnly
          />
        </div>
        <div>
          <Label className="text-xs">UOM</Label>
          <Input
            name="uom"
            value={newPart.uom}
            className="bg-input"
            disabled={isBusy}
            readOnly
          />
        </div>
        <div>
          <Label className="text-xs">Qty</Label>
          <Input
            name="qty"
            type="number"
            min={0}
            onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
              e.preventDefault();
            }
          }}
            value={newPart.qty}
            onChange={handleNewPartChange}
            className="bg-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            disabled={isBusy}
          />
        </div>
        <div>
          <Label className="text-xs">Expense</Label>
          <Input
            name="expense"
            type="number"
            value={newPart.expense}
            onChange={handleNewPartChange}
            className="bg-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            disabled={isBusy}
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Remark</Label>
          <Input
            name="remark"
            value={newPart.remark || ""}
            onChange={handleNewPartChange}
            className="bg-input"
            disabled={isBusy}
          />
        </div>
        <Button onClick={addPartEntry} disabled={isBusy} className="self-end">
          <Plus className="w-4 h-4 mr-2" /> Add Part
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Item Code</TableHead>
              <TableHead>Item Group</TableHead>
              <TableHead>Stock Qty</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Expense</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.item_name}</TableCell>
                <TableCell>{entry.item_group}</TableCell>
                <TableCell>{entry.stock_qty}</TableCell>
                <TableCell>{entry.uom}</TableCell>
                <TableCell>{entry.qty}</TableCell>
                <TableCell>{entry.expense}</TableCell>
                <TableCell>{entry.remark}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePartEntry(entry.id)}
                    disabled={isBusy}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
"use client";

import { useState } from "react";
import { Badge, Button, Card, CardTitle, Input, Modal } from "@/components/ui";
import type { MerchProduct } from "@/lib/types";
import { useStore } from "@/lib/useStore";
import { deleteProduct, saveProduct } from "@/lib/services/merch";

// ผู้รับผิดชอบ: อรอนงค์
// ชั่วคราว ระหว่างรอระบบล็อกอินของปอ
const EVENT_ID = "ev_reunion";

export default function OrganizerMerchProductsPage() {
  const allProducts = useStore("merchProducts");
  const products = allProducts.filter((p) => p.eventId === EVENT_ID);
  // เปิดหน้าต่างเมื่อ modalOpen เป็น true
  // editing = null → กำลังเพิ่มสินค้าใหม่ / เป็นสินค้า → กำลังแก้ตัวนั้น
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MerchProduct | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  // ไซส์แต่ละแถว เก็บ stock เป็นข้อความ
  const [variants, setVariants] = useState<{ size: string; stock: string }[]>([]);
  const [formError, setFormError] = useState("");
  // ข้อความแดงของตาราง เช่น เปลี่ยนสถานะไม่สำเร็จ
  const [tableError, setTableError] = useState("");

  function openAdd() {
    setEditing(null);
    setName("");
    setPrice("");
    setDescription("");
    setVariants([{ size: "FREE", stock: "0" }]);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(product: MerchProduct) {
    setEditing(product);
    setName(product.name);
    setPrice(String(product.price));
    setDescription(product.description ?? "");
    setVariants(
      product.variants.map((v) => ({ size: v.size, stock: String(v.stock) })),
    );
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function changeVariant(
    index: number,
    field: "size" | "stock",
    value: string,
  ) {
    setVariants((list) =>
      list.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  }

  function addVariant() {
    setVariants((list) => [...list, { size: "", stock: "0" }]);
  }

  function removeVariant(index: number) {
    setVariants((list) => list.filter((_, i) => i !== index));
  }

  function handleSave() {
    // ไซส์ที่ผู้ใช้ปล่อยว่างทั้งชื่อไซส์ ไม่ต้องนับ
    const cleanedVariants = variants
      .filter((v) => v.size.trim() !== "")
      .map((v) => ({ size: v.size.trim(), stock: Number(v.stock) }));

    if (cleanedVariants.length === 0) {
      setFormError("กรุณาเพิ่มไซส์อย่างน้อย 1 ไซส์");
      return;
    }
    if (cleanedVariants.some((v) => !Number.isInteger(v.stock))) {
      setFormError("สต็อกต้องเป็นจำนวนเต็ม");
      return;
    }
     const product: MerchProduct = {
      id: editing?.id ?? "",
      eventId: editing?.eventId ?? EVENT_ID,
      name,
      description: description.trim() === "" ? undefined : description.trim(),
      image: editing?.image,
      price: Number(price),
      variants: cleanedVariants,
      active: editing?.active ?? true,
      createdAt: editing?.createdAt ?? "",
    };

    try {
      saveProduct(product);
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    }
  }

  function toggleActive(product: MerchProduct) {
    try {
      saveProduct({ ...product, active: !product.active });
      setTableError("");
    } catch (err) {
      setTableError(
        err instanceof Error ? err.message : "เปลี่ยนสถานะไม่สำเร็จ",
      );
    }
  }

  function handleDelete(product: MerchProduct) {
    if (!window.confirm(`ลบ "${product.name}" ใช่หรือไม่`)) return;
    try {
      deleteProduct(product.id);
      setTableError("");
    } catch (err) {
      setTableError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>สินค้าและของที่ระลึก ({products.length} รายการ)</CardTitle>
        <div className="mb-3">
          <Button onClick={openAdd}>เพิ่มสินค้า</Button>
        </div>
        {tableError && (
          <p className="mb-2 text-sm text-red-600">{tableError}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">สินค้า</th>
                <th className="py-2 pr-4 font-medium">ราคา</th>
                <th className="py-2 pr-4 font-medium">สต็อกแต่ละไซส์</th>
                <th className="py-2 pr-4 font-medium">สถานะ</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{p.name}</td>
                  <td className="py-2 pr-4">{p.price} บาท</td>
                  <td className="py-2 pr-4">
                    {p.variants.map((v) => `${v.size}: ${v.stock}`).join(", ")}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge tone={p.active ? "green" : "gray"}>
                      {p.active ? "เปิดขาย" : "ปิดขาย"}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEdit(p)}
                      >
                        แก้ไข
                      </Button>
                      <Button
                        size="sm"
                        variant={p.active ? "danger" : "secondary"}
                        onClick={() => toggleActive(p)}
                      >
                        {p.active ? "ปิดขาย" : "เปิดขาย"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDelete(p)}
                      >
                        ลบ
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <p className="py-6 text-center text-slate-500">ยังไม่มีสินค้า</p>
        )}
      </Card>
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? `แก้ไข · ${editing.name}` : "เพิ่มสินค้า"}
      >
        <form
          className="w-full max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <Input
            label="ชื่อสินค้า"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="ราคา (บาท)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Input
            label="คำอธิบาย (ไม่บังคับ)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="space-y-2">
            <p className="text-sm text-slate-600">ไซส์และสต็อก</p>
            {variants.map((v, i) => (
              <div key={i} className="flex items-end gap-2 [&>*:not(button)]:min-w-0 [&>*:not(button)]:flex-1">
                <Input
                  label="ไซส์"
                  value={v.size}
                  onChange={(e) => changeVariant(i, "size", e.target.value)}
                />
                <Input
                  label="สต็อก"
                  type="number"
                  value={v.stock}
                  onChange={(e) => changeVariant(i, "stock", e.target.value)}
                />
                <Button
                  size="sm"
                  variant="danger"
                  className="shrink-0"
                  onClick={() => removeVariant(i)}
                >
                  ลบ
                </Button>
              </div>
            ))}
            <Button size="sm" variant="secondary" onClick={addVariant}>
              + เพิ่มไซส์
            </Button>  
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>
              ยกเลิก
            </Button>
            <Button type="submit">บันทึก</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

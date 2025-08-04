import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function StepOne({ form }: { form: any }) {
  const fields = [
    "businessName", "businessType", "address", "City", "addressState",
    "Country", "Pincode", "Telephone", "mobileNumber", "emailId",
    "Website", "PANNumber", "IncomeTaxLoginPassword"
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
       
      {fields.map((field) => (
        <FormField
          key={field}
          control={form.control}
          name={field}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>{field}</FormLabel>
              <FormControl>
                <Input {...f} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}

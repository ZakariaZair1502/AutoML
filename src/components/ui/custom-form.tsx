import React from 'react';
import { cn } from '@/lib/utils';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, ...props }, ref) => (
    <form
      ref={ref}
      className={cn("space-y-6", className)}
      {...props}
    />
  )
);
Form.displayName = "Form";

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mb-6", className)}
      {...props}
    />
  )
);
FormGroup.displayName = "FormGroup";

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "block mb-2 text-sm font-medium text-gray-light",
        className
      )}
      {...props}
    />
  )
);
FormLabel.displayName = "FormLabel";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md text-gray-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
        className
      )}
      {...props}
    />
  )
);
FormInput.displayName = "FormInput";

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md text-gray-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[120px]",
        className
      )}
      {...props}
    />
  )
);
FormTextarea.displayName = "FormTextarea";

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md text-gray-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none",
        className
      )}
      {...props}
    />
  )
);
FormSelect.displayName = "FormSelect";

interface FormHelperTextProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormHelperText = React.forwardRef<HTMLParagraphElement, FormHelperTextProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("mt-2 text-sm text-gray-light/70", className)}
      {...props}
    />
  )
);
FormHelperText.displayName = "FormHelperText";

interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={cn(
        "w-4 h-4 text-primary bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded focus:ring-primary focus:ring-2",
        className
      )}
      {...props}
    />
  )
);
FormCheckbox.displayName = "FormCheckbox";

export {
  Form,
  FormGroup,
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
  FormHelperText,
  FormCheckbox,
};

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const CustomCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-[rgba(255,255,255,0.05)] backdrop-blur-md rounded-lg overflow-hidden shadow transition-all border border-[rgba(255,255,255,0.1)] hover:-translate-y-1 hover:shadow-lg hover:border-[rgba(255,255,255,0.2)]",
        className
      )}
      {...props}
    />
  )
);
CustomCard.displayName = "CustomCard";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CustomCardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-6 border-b border-[rgba(255,255,255,0.1)] flex justify-between items-center",
        className
      )}
      {...props}
    />
  )
);
CustomCardHeader.displayName = "CustomCardHeader";

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const CustomCardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props} />
  )
);
CustomCardBody.displayName = "CustomCardBody";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CustomCardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-6 border-t border-[rgba(255,255,255,0.1)]",
        className
      )}
      {...props}
    />
  )
);
CustomCardFooter.displayName = "CustomCardFooter";

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CustomCardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-semibold text-white", className)}
      {...props}
    />
  )
);
CustomCardTitle.displayName = "CustomCardTitle";

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CustomCardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-gray-light/80 mt-2", className)}
      {...props}
    />
  )
);
CustomCardDescription.displayName = "CustomCardDescription";

export {
  CustomCard,
  CustomCardHeader,
  CustomCardBody,
  CustomCardFooter,
  CustomCardTitle,
  CustomCardDescription,
};

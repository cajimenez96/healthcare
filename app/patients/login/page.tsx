import Image from "next/image";

import PatientLoginForm from "@/components/forms/PatientLoginForm";

const PatientLoginPage = () => {
  return (
    <div className="flex h-screen max-h-screen">
      <section className="remove-scrollbar container my-auto">
        <div className="sub-container max-w-[496px]">
          <Image
            src="/assets/icons/logo-full.svg"
            height={1000}
            width={1000}
            alt="clinic"
            className="mb-12 h-10 w-fit"
          />

          <PatientLoginForm />

          <p className="text-14-regular mt-20 text-dark-600 xl:text-left">© 2024 CarePluse</p>
        </div>
      </section>

      <Image
        src="/assets/images/onboarding-img.png"
        height={1000}
        width={1000}
        alt="clinic"
        className="side-img max-w-[50%]"
      />
    </div>
  );
};

export default PatientLoginPage;

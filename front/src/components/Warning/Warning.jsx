import PropTypes from "prop-types";
import React from "react";
import warningLine from "./warning_line.svg";
import "./style.css";

export const Warning = ({ one, onClose }) => {
  if (!one || one === "hidden") return null;

  return (
    <div className="warning-overlay" onClick={onClose}>
      <div className="warning-modal">
        <div className="frame">
          <div className="div">
            <div className="service-is-not-ready">
              {one === "forget-password" && <>Service is not ready!</>}
              {one === "incorrect-password" && <>Incorrect password!</>}
              {one === "unrequire-password" && (
                <>Password does’t meet the requirements!</>
              )}
              {one === "incorrect-password-confirm" && (
                <>Password do not match!</>
              )}
              {one === "unrequire-email" && <>Invalid email format!</>}
              {one === "register-complete" && <>Registration complete!</>}
              {one === "medication-complete" && <>Registration complete!</>}
              {one === "welcome" && <>Welcome to our MediPin!</>}
              {one === "logout" && <>See you soon!</>}
            </div>

            <img className="line" alt="line" src={warningLine} />
          </div>

          <div className="service-is-currently">
            {one === "forget-password" && (
              <>
                Service is currently under developmet.
                <br />
                Please try again later! :-)
              </>
            )}

            {["incorrect-password", "unrequire-password"].includes(one) && (
              <>
                The password you entered is incorrect.
                <br />
                Please check and try again.
              </>
            )}

            {one === "incorrect-password-confirm" && (
              <>
                Please make sure your password
                <br />
                and confirmation password are the same.
              </>
            )}

            {one === "unrequire-email" && (
              <>
                Please enter a valid email address.
                <br />
                Check the format and try again.
              </>
            )}

            {one === "welcome" && (
              <>
                Enjoy service :-)
              </>
            )}

            {one === "register-complete" && (
              <>
                Enjoy our service
                <br />
                and have a great time using it!
              </>
            )}

            {one === "medication-complete" && (
              <>
                Medication schedule saved successfully.
              </>
            )}

            {one === "logout" && (
              <>
                You’re all logged out.
                <br />
                Come back anytime!
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Warning.propTypes = {
  one: PropTypes.oneOf([
    "forget-password",
    "incorrect-password",
    "unrequire-password",
    "incorrect-password-confirm",
    "unrequire-email",
    "register-complete",
    "welcome",
    "logout",
    "hidden",
  ]),
  onClose: PropTypes.func.isRequired,
};

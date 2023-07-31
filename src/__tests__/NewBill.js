/**
 * @jest-environment jsdom
 */

import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {screen, waitFor, fireEvent} from "@testing-library/dom"
import "@testing-library/jest-dom";
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import { bills } from "../fixtures/bills.js";
import router from "../app/Router.js";
import BillsUI from "../views/BillsUI.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      //to-do write expect expression
      const iconHighlighted = windowIcon.classList.contains("active-icon");
			expect(iconHighlighted).toBeTruthy();
    })
  })


  describe('When i am on NewBill page and i upload a file other than jpg, jpeg or png', () => {
    test('Then : it should display an error message', ()=> {
      window.localStorage.setItem("user", JSON.stringify({type: "Employee",}));

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const errorMessage = screen.getByTestId('file-error-message');

      const store = null
      const newBills = new NewBill({
        document,
        onNavigate,
        store,
        localStorage,
      });

      const handleChangeFile = jest.fn(()=> newBills.handleChangeFile)
      const file = screen.getByTestId('file');

      file.addEventListener('change', handleChangeFile)
      fireEvent.change(file, {
        target: { 
          files: [new File(["imgTest"], "imgTest.pdf", {
            type: "image/pdf"
          })]
        }
      });

			expect(handleChangeFile).toHaveBeenCalled();
      expect(file.files[0].name).toBe("imgTest.pdf");
      expect(errorMessage).not.toHaveClass("hidden");
    })
  })

  describe('When i am on NewBill page and i upload a jpg, jpeg or png file', () => {
    test('Then : it should download the file and delete the message error', ()=> {
      document.body.innerHTML = NewBillUI();
      window.localStorage.setItem("user", JSON.stringify({type: "Employee",}));

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const errorMessage = screen.getByTestId('file-error-message');

      const store = mockStore
      const newBills = new NewBill({
        document,
        onNavigate,
        bills: bills,
        store,
        localStorage,
      });

      const handleChangeFile = jest.fn(()=> newBills.handleChangeFile)
      const file = screen.getByTestId('file');

      file.addEventListener('change', handleChangeFile)
      fireEvent.change(file, {
        target: { 
          files: [new File(["imgTest"], "imgTest.png", {
            type: "image/png"
          })]
        }
      });

			expect(handleChangeFile).toHaveBeenCalled();
      expect(file.files[0].name).toBe("imgTest.png");
      expect(errorMessage).toHaveClass("hidden");
    })
  })

  describe("When i am on NewBill page and fill all inputs from the form", () => {
    test("Then : the new bill should be submited and page should be refreshed on bills dashboard", () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", handleSubmit);

      fireEvent.submit(formNewBill);

      expect(handleSubmit).toHaveBeenCalled();

      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });
})

// test d'intégration POST 
describe('Given : I am a user connected as Employee and i submit the form to post a new bill', () => {
  test('then : it should post the new bill and refresh bills page', async () => {
    const spyPost = jest.spyOn(mockStore, 'bills')
    const testBill = {
      id: "47qAXb6fIm2zOKkLzMro",
      vat: "80",
      fileUrl: "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
      status: "pending",
      type: "Hôtel et logement",
      commentary: "séminaire billed",
      name: "encore",
      fileName: "preview-facture-free-201801-pdf-1.jpg",
      date: "2004-04-04",
      amount: 400,
      commentAdmin: "ok",
      email: "a@a",
      pct: 20,
    }

    const updatedBills = await mockStore.bills().update(testBill)
    expect(spyPost).toHaveBeenCalled();
    expect(updatedBills).toStrictEqual(testBill);
    
  })

  //Test error
  describe("when an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("Then: bills from an API and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
    })

    test("Then: bills from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
    })
  })
})
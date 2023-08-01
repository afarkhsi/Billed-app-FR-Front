/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import Bills from "../containers/Bills.js";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      const iconHighlighted = windowIcon.classList.contains("active-icon");
			expect(iconHighlighted).toBeTruthy();
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

describe("when i click to add a new bill", () => {
  test("Then : a modal shoul open", () => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({type: "Employee",}));

    document.body.innerHTML = BillsUI({ data: [] });
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    const store = null
    const bills = new Bills({
      document,
      onNavigate,
      store,
      localStorage: window.localStorage,
    });
    const handleClickNewBill = jest.fn((e) => bills.handleClickNewBill(e));
    const newBillBtn = screen.getByTestId("btn-new-bill");
    newBillBtn.click("click", handleClickNewBill);
    expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
  });
})

describe("when i click on the icon button to see one bill", () => {
  test("Then : a modal should open", () => {
    document.body.innerHTML = BillsUI({ data: bills });

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const store = null 

    const bill = new Bills({
      document,
      onNavigate,
      store,
      localStorage: window.localStorage,
    });
    $.fn.modal = jest.fn();
    const viewBtn = screen.getAllByTestId("icon-eye")[0];
    const handleClickIconEye = jest.fn((e) => {
      e.preventDefault();
      bill.handleClickIconEye(viewBtn);
    });
    viewBtn.addEventListener("click", handleClickIconEye);
    fireEvent.click(viewBtn);

    expect(handleClickIconEye).toHaveBeenCalled();
  });
});


// test d'intégration GET
describe("Given : I am a user connected as Employee", () => {
  describe("When I navigate to Bills home page", () => {
    test("Then : fetches bills from mock API GET", async () => {

      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router();

      window.onNavigate(ROUTES_PATH.Bills)

      expect(await waitFor(() =>screen.getByText("Mes notes de frais"))).toBeTruthy();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      expect(screen.getByText("Nouvelle note de frais")).toBeTruthy();
      expect(screen.getAllByTestId("tbody")).toBeTruthy();
    });

  describe("When an error occurs on API", () => {
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
    test("Then, fetches bills from an API and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
    })

    test("Then, fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Dashboard)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })

  })
})